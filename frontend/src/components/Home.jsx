import React, { useState } from "react";
import { Upload, Button, Table, Spin, message, Tag , Select } from "antd";
import { UploadOutlined, TagOutlined, DownloadOutlined } from "@ant-design/icons";

const { Option } = Select;

const Home = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 }); // Define pagination state

  const handleFileChange = (info) => {
    setSelectedFiles(info.fileList);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleSkillChange = (value) => {
    setSkills(value);
  };

  const uploadPDFs = async () => {
    if (selectedFiles.length === 0) {
      console.error("No files selected.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("resume_files", file.originFileObj); // Use originFileObj to access the file object
    }
    formData.append("job_description", jobDescription);
    formData.append("skills", JSON.stringify(skills));

    try {
      const response = await fetch("http://localhost:8000/extract_and_sort", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
      message.error("An error occurred while processing files.");
    }

    setLoading(false);
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(`http://localhost:8000/download/${filename}`, {
        method: 'GET',
        responseType: 'blob', // Set responseType to 'blob' to handle binary data
      });
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error('Failed to download PDF');
    }
  };
  

  const columns = [
    {
      title: "Filename",
      dataIndex: "filename",
      key: "filename",
    },
    {
      title: "Score",
      dataIndex: "score",
      key: "score",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Button
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record.filename)}
        >
          Download
        </Button>
      ),
    },
  ];

  // Handle pagination change
  const handlePaginationChange = (current, pageSize) => {
    setPagination({ current, pageSize });
  };

  return (
    <div className="p-8">
      <h1 className="text-5xl font-serif bg-orange-200 p-2 mb-8 text-center">
        Automated Resume Screening
      </h1>
      <div className="flex justify-center items-center mb-4">
        <Upload
          multiple
          onChange={handleFileChange}
          fileList={selectedFiles}
          showUploadList={{ showRemoveIcon: true }}
          customRequest={() => {}}
          beforeUpload={() => false}
        >
          <Button icon={<UploadOutlined />}>Select PDFs</Button>
        </Upload>
        <Button
          onClick={uploadPDFs}
          className="ml-4"
          loading={loading}
        >
          Upload
        </Button>
      </div>
      <div className="flex justify-center items-center mb-4">
        <input
          className="p-2 border border-gray-300 rounded mr-2"
          type="text"
          placeholder="Enter job description"
          value={jobDescription}
          onChange={handleJobDescriptionChange}
        />
        <TagOutlined className="text-xl text-gray-500 mr-2" />
        <span className="text-lg font-semibold mr-2">Skills:</span>
        <Select
          mode="tags"
          style={{ width: '50%' }}
          placeholder="Add skills"
          value={skills}
          onChange={handleSkillChange}
          className="flex-grow"
        >
          {/* Add options dynamically from skills state */}
          <Option key="Skill1">Skill1</Option>
          <Option key="Skill2">Skill2</Option>
          <Option key="Skill3">Skill3</Option>
        </Select>
      </div>
      {loading && (
        <div className="mt-8 text-center">
          <Spin tip="Processing files..." size="large" />
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Results:</h2>
          <Table 
            dataSource={results} 
            columns={columns} 
            pagination={{ ...pagination, total: results.length, onChange: handlePaginationChange }} // Configure pagination
          />
        </div>
      )}
    </div>
  );
};

export default Home;
