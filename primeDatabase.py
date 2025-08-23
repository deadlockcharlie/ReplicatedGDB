import os
import csv
import sys
import requests
from tqdm import tqdm
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
session = requests.Session()

# retry logic for dropped connections
retries = Retry(
    total=5,
    backoff_factor=0.2,
    status_forcelist=[500, 502, 503, 504],
    raise_on_status=False
)

adapter = HTTPAdapter(pool_connections=100, pool_maxsize=100, max_retries=retries)
session.mount("http://", adapter)

logging.basicConfig(filename='error_log.txt', level=logging.ERROR, 
                    format='%(asctime)s %(levelname)s:%(message)s')

# --- CONFIG ---
HEADERS = {"Content-Type": "application/json"}  # Customize if needed
vertex_url = "http://localhost:3000/api/addVertex"
edge_url = "http://localhost:3000/api/addEdge"
Vertices = [
    # Static
        ("Place","place_0_0.csv"),
        ("TagClass","tagclass_0_0.csv"),
        ("Organization","organisation_0_0.csv"),
        ("Tag","tag_0_0.csv"),
    #Dynamic
        ("Comment","comment_0_0.csv"),
        ("Forum","forum_0_0.csv"),
        ("Person","person_0_0.csv"),
        ("Post","post_0_0.csv")
        ]

Edges = [
    #Static
        # ("Place","IS_PART_OF", "Place","place_isPartOf_place_0_0.csv"),
        # ("TagClass","IS_SUBCLASS_OF","TagClass","tagclass_isSubclassOf_tagclass_0_0.csv"),
        # ("Tag","HAS_TYPE","TagClass","tag_hasType_tagclass_0_0.csv"),
        # ("organization","IS_LOCATED_IN","Place","organisation_isLocatedIn_place_0_0.csv"),
    # #Dynamic
        ("Forum", "HAS_MEMBER", "Person", "forum_hasMember_person_0_0.csv"),
        ("Comment", "HAS_CREATOR", "Person", "comment_hasCreator_person_0_0.csv"),
        ("Comment", "HAS_TAG", "Tag", "comment_hasTag_tag_0_0.csv"),
        ("Comment", "IS_LOCATED_IN", "Place", "comment_isLocatedIn_place_0_0.csv"),
        ("Comment", "REPLY_OF", "Comment", "comment_replyOf_comment_0_0.csv"),
        ("Comment", "REPLY_OF", "Post", "comment_replyOf_post_0_0.csv"),
    #     ("Forum", "CONTAINER_OF", "Post", "forum_containerOf_post_0_0.csv"),
    #     ("Forum", "HAS_MODERATOR", "Person", "forum_hasModerator_person_0_0.csv"),
    #     ("Forum", "HAS_TAG", "Tag", "forum_hasTag_tag_0_0.csv"),
    #     ("Person", "EMAIL", "emailaddress", "person_email_emailaddress_0_0.csv"),
    #     ("Person", "HAS_INTEREST", "Tag", "person_hasInterest_tag_0_0.csv"),
    #     ("Person", "IS_LOCATED_IN", "Place", "person_isLocatedIn_place_0_0.csv"),
    #     ("Person", "KNOWS", "Person", "person_knows_person_0_0.csv"),
    #     ("Person", "LIKES", "comment", "person_likes_comment_0_0.csv"),
    #     ("Person", "LIKES", "Post", "person_likes_post_0_0.csv"),
    #     ("Person", "SPEAKS", "language", "person_speaks_language_0_0.csv"),
    #     ("Person", "STUDY_AT", "organisation", "person_studyAt_organisation_0_0.csv"),
    #     ("Person", "WORK_AT", "organisation", "person_workAt_organisation_0_0.csv"),
    #     ("Post", "HAS_CREATOR", "Person", "post_hasCreator_person_0_0.csv"),
    #     ("Post", "HAS_TAG", "Tag", "post_hasTag_tag_0_0.csv"),
    #     ("Post", "IS_LOCATED_IN", "Place", "post_isLocatedIn_place_0_0.csv")
        ]

def count_lines(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return sum(1 for _ in f)
    
lock = threading.Lock()   # needed for thread-safe tqdm updates
def send_request(url, data, pbar):
    try:
        response = session.post(url, json=data, timeout=50)
        response.raise_for_status()
    except requests.RequestException as e:
        return False, str(e)
    finally:
        with lock:
            pbar.update(1)
    return True, None

def processVertexFile(filepath, label, max_workers=32):
    total_lines = count_lines(filepath)
    errors=[]
    with open(filepath, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter='|')
        # headers = next(reader)
        with tqdm(total=total_lines - 1, desc=f"Processing {filepath}") as pbarSend:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures=[]
                for row in reader:
                    body={}
                    body["label"]=[label]
                    body["properties"]={}
                    for key, value in row.items():
                        if key.strip().lower() == "id":
                            body["properties"]["id"] = label+value
                        else:
                            body["properties"][key] = value
                    futures.append(executor.submit(send_request, vertex_url, body, pbarSend))
            
            for future in as_completed(futures):
                success, error = future.result()
                if not success:
                    logging.error(f"[ERROR] {error}")

    print(f"Finished {filepath}, errors: {len(errors)}")
            # for row in reader:
            #     body={}
            #     body["label"]=[label]
            #     body["properties"]={}
            #     for key, value in row.items():
            #         if key.strip().lower() == "id":
            #             body["properties"]["identifier"] = label+value
            #         else:
            #             body["properties"][key] = value
            #     try:
            #         response = requests.Post(vertex_url, json=body, headers=HEADERS,timeout=30)
            #         if response.status_code != 200:
            #             
            #         # else:
            #         #     print(f"[OK] {label} → {body}")
            #     except requests.RequestException as e:
            #             logging.error(f"[FAILED] {e}")
                
                # break

def processEdgeFile(filepath, sourcelabel, label, targetlabel,  max_workers=8):
    total_lines = count_lines(filepath)
    with open(filepath, newline='', encoding='utf-8') as csvfile:
        reader = csv.reader(csvfile, delimiter='|')
        headers = next(reader)
        with tqdm(total=total_lines - 1, desc=f"Processing {filepath}") as pbarSend:
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                futures=[]
                for row in reader:
                    body={}
                    body["sourceLabel"]=[sourcelabel]
                    body["targetLabel"]=[targetlabel]
                    body["sourcePropName"]="id"
                    body["sourcePropValue"] = sourcelabel+row[0]
                    body["targetPropName"]="id"
                    body["targetPropValue"] = targetlabel+row[1]
                    body["relationType"]=[label]
                    if(len(headers)>2):

                        ## Missing logic here: Need to add all properties to the set of props in the query.
                        body["properties"]={}
                        body["properties"]["id"]= sourcelabel+targetlabel+row[0]+row[1]
                    # print(body)

                    futures.append(executor.submit(send_request, edge_url, body, pbarSend))
                    # try:
                    #     response = requests.Post(edge_url, json=body, headers=HEADERS,timeout=30)
                    #     if response.status_code != 200:
                    #         logging.error(f"[ERROR {response.status_code}] {response.text}")  
                    #     # else:
                    #     #    print(f"[OK] {label} → {body}")
                    # except requests.RequestException as e:
                    #     logging.error(f"[FAILED] {e}")
            for future in as_completed(futures):
                success, error = future.result()
                if not success:
                    logging.error(f"[ERROR] {error}")
            
def main():
    if len(sys.argv) != 2:
        print(f"Usage: python {sys.argv[0]} <directory>")
        sys.exit(1)

    directory = sys.argv[1]

    if not os.path.isdir(directory):
        print(f"Error: '{directory}' is not a valid directory.")
        sys.exit(1)

    for label,filename in Vertices:
        file = os.path.join(directory, filename)
        if os.path.isfile(file):
            print(filename)
            processVertexFile(file,label)
        else:
            print("Error: Could not find "+filename+" in the path specified")
    
    # for sourcelabel, edgelabel, targetlabel,filename in Edges:
    #     file = os.path.join(directory, filename)
    #     if os.path.isfile(file):
    #         print(filename)
    #         processEdgeFile(file,sourcelabel, edgelabel, targetlabel)
    #     else:
    #         print("Error: Could not find "+filename+" in the path specified")
    
            
if __name__ == "__main__":
    main()