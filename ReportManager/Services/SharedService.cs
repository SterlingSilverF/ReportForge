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

        // This thing is the bane of my existence. Worth it though. This is why we have test plans.
        public T MapObjectToModel<T>(object sourceObject) where T : new()
        {
            T destination = new T();
            Type destinationType = typeof(T);
            foreach (PropertyInfo sourceProp in sourceObject.GetType().GetProperties())
            {
                PropertyInfo destinationProp = destinationType.GetProperty(sourceProp.Name);
                if (destinationProp != null && destinationProp.CanWrite)
                {
                    object value = sourceProp.GetValue(sourceObject);
                    if (value != null)
                    {
                        if (destinationProp.PropertyType == typeof(ObjectId?) && sourceProp.PropertyType == typeof(string))
                        {
                            string sourceValue = value as string;
                            value = !string.IsNullOrEmpty(sourceValue) ? (ObjectId?)StringToObjectId(sourceValue) : null;
                        }
                        else if (destinationProp.PropertyType == typeof(HashSet<ObjectId>) && sourceProp.PropertyType == typeof(HashSet<string>))
                        {
                            HashSet<string> sourceHashSet = value as HashSet<string>;
                            value = sourceHashSet != null
                                ? new HashSet<ObjectId>(sourceHashSet.Select(StringToObjectId))
                                : new HashSet<ObjectId>();
                        }
                        else if (destinationProp.PropertyType == typeof(List<ObjectId>) && sourceProp.PropertyType == typeof(List<string>))
                        {
                            List<string> sourceList = value as List<string>;
                            value = sourceList != null
                                ? sourceList.Select(StringToObjectId).ToList()
                                : new List<ObjectId>();
                        }
                        else if (destinationProp.PropertyType == typeof(ObjectId) && sourceProp.PropertyType == typeof(string))
                        {
                            value = StringToObjectId(value as string);
                        }
                        destinationProp.SetValue(destination, value);
                    }
                }
            }
            return destination;
        }
    }
}
