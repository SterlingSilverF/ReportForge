using MongoDB.Bson;
using System.Collections;
using System.Reflection;

namespace ReportManager.Services
{
    public class SharedService
    {
        public SharedService() { }

        public ObjectId StringToObjectId(string objectIdStr)
        {
            ObjectId parsedObjectId;
            if (ObjectId.TryParse(objectIdStr, out parsedObjectId))
            {
                return parsedObjectId;
            }
            throw new InvalidCastException();
        }

        public T MapObjectToModel<T>(object sourceObject) where T : new()
        {
            T destination = new T();
            Type destinationType = typeof(T);

            foreach (PropertyInfo sourceProp in sourceObject.GetType().GetProperties())
            {
                PropertyInfo destinationProp = destinationType.GetProperty(sourceProp.Name);

                if (destinationProp != null)
                {
                    object value = sourceProp.GetValue(sourceObject);
                    if (destinationProp.PropertyType == typeof(ObjectId?) && sourceProp.PropertyType == typeof(string))
                    {
                        string sourceValue = value as string;
                        ObjectId? objectIdValue = null;

                        if (!string.IsNullOrEmpty(sourceValue))
                        {
                            objectIdValue = StringToObjectId(sourceValue);
                        }

                        value = objectIdValue;
                    }
                    else if (destinationProp.PropertyType == typeof(HashSet<ObjectId>) && sourceProp.PropertyType == typeof(HashSet<string>))
                    {
                        HashSet<string> sourceHashSet = value as HashSet<string>;
                        HashSet<ObjectId> destHashSet = sourceHashSet != null
                            ? new HashSet<ObjectId>(sourceHashSet.Select(s => StringToObjectId(s)))
                            : new HashSet<ObjectId>();

                        value = destHashSet;
                    }
                    else if (destinationProp.PropertyType == typeof(List<ObjectId>) && sourceProp.PropertyType == typeof(List<string>))
                    {
                        List<string> sourceList = value as List<string>;
                        List<ObjectId> destList = sourceList != null
                            ? sourceList.Select(s => StringToObjectId(s)).ToList()
                            : new List<ObjectId>();

                        value = destList;
                    }
                    else if (destinationProp.PropertyType == typeof(ObjectId) && sourceProp.PropertyType == typeof(string))
                    {
                        value = StringToObjectId(value as string);
                    }

                    destinationProp.SetValue(destination, value);
                }
            }
            return destination;
        }
    }
}
