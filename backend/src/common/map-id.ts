export function mapDoc(doc: any) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  return { ...obj, id: obj._id?.toString() || obj.id };
}

export function mapDocs(docs: any[]) {
  return docs.map((d) => mapDoc(d));
}
