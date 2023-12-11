import React, { useState } from "react";

const ReportConfigurationForm = () => {
    const [formData, setFormData] = useState({
        ReportID: "",
        ReportName: "",
        Description: "",
        SourceDB: "",
        Schedule: { ScheduleType: "Daily", Iteration: 1, ExecuteTime: "00:00:00"},
        ReportJobs: [],
        PaginationLimit: 0,
        FolderId: "",
        CreatorId: "",
        CreatedDate: "",
        LastModifiedDate: "",
        LastModifiedBy: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData({ formData, [name]: value });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        // Submit logic here
    };

    const handleScheduleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prevFormData => {
            return {
                ...prevFormData,
                Schedule: {
                    ...prevFormData.Schedule,
                    [name]: value
                }
            };
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ReportName, Description */}
            <input
                type="text"
                name="ReportName"
                value={formData.ReportName}
                onChange={handleChange}
                placeholder="Name This Report..."
                required
            />
            <input
                type="text"
                name="Description"
                value={formData.Description || ""}
                onChange={handleChange}
                placeholder="Description"
            />
            {/* Database Connections: To be populated via API */}
            <select name="SourceDB" onChange={handleChange}>
                <option value="" disabled selected>
                    Select Source Database
                </option>
                {/* Populate this dropdown with API data */}
            </select>
            {/* ScheduleInfo */}
            <select
                name="ScheduleType"
                value={formData.Schedule.ScheduleType}
                onChange={handleScheduleChange}>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                {/* Other options */}
            </select>
            <input
                type="number"
                name="Iteration"
                value={formData.Schedule.Iteration}
                onChange={handleScheduleChange}
                placeholder="Iteration"/>
            {/* PaginationLimit */}
            <input
                type="number"
                name="PaginationLimit"
                value={formData.PaginationLimit}
                onChange={handleChange}
                placeholder="Pagination Limit"/>

            {/* ScheduleInfo */}
            <select
                name="ScheduleType"
                value={formData.Schedule.ScheduleType}
                onChange={handleScheduleChange}>
                {/* Options here */}
            </select>
            <input
                type="number"
                name="Iteration"
                value={formData.Schedule.Iteration}
                onChange={handleScheduleChange}
                placeholder="Iteration"
            />
            <button type="submit">Submit</button>
        </form>
    );
};

export default ReportConfigurationForm;