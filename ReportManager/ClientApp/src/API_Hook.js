import { useState, useEffect } from 'react';
import axios from 'axios';
import qs from 'query-string';

const useApi = (controller, functionToCall, params) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const query = params ? '?' + qs.stringify(params) : '';
            const url = `/api/${controller}/${functionToCall}${query}`;
            const response = await axios.get(url);
            setData(response.data);
        };

        fetchData();
    }, [controller, functionToCall, params]);

    return data;
};