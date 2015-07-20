import pymongo
import argparse

from bson.binary import Binary


def load_image_into_collection(image_path, uri, db, coll):
    conn = pymongo.MongoClient(uri)

    with open(image_path, 'rb') as f:
        data = f.read()

    conn[db][coll].insert({'img': Binary(data)})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--image', type=str, required=True, help='Image Path')
    parser.add_argument('-d', '--database', type=str, required=True, help='MongoDB Database')
    parser.add_argument('-c', '--collection', type=str, required=True, help='MongoDB Collection')
    parser.add_argument('-u', '--uri', type=str, required=False, default='mongodb://localhost:27017',
                        help='MongoDB URI')
    args = parser.parse_args()
    load_image_into_collection(args.image, args.uri, args.database, args.collection)
