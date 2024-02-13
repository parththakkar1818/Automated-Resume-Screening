import React, { useState } from 'react';
import { Upload, Button, Table, Spin, message, Input } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const FileUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const handleFileChange = (info) => {
    setSelectedFiles(info.fileList);
  };

  const uploadPDFs = async () => {
    if (selectedFiles.length === 0) {
      message.error('Please select PDF files to upload.');
      return;
    }

    if (!jobDescription.trim()) {
      message.error('Please enter a job description.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('resume_files', file.originFileObj);
    }
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://localhost:8000/extract_and_sort', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      message.error('An error occurred while processing files.');
    }

    setLoading(false);
  };

  const columns = [
    {
      title: 'Filename',
      dataIndex: 'filename',
      key: 'filename',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
    },
  ];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-semibold text-center mb-8">Automated Resume Screening</h1>
      <div className="flex justify-center items-center mb-4">
        <TextArea
          placeholder="Enter job description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="mr-4"
        />
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
      </div>
      <div className="flex justify-center">
        <Button
          onClick={uploadPDFs}
          loading={loading}
          disabled={selectedFiles.length === 0 || !jobDescription.trim()}
        >
          Upload
        </Button>
      </div>
      {loading && (
        <div className="flex justify-center items-center mt-8">
          <Spin tip="Processing files..." size="large" />
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Results:</h2>
          <Table dataSource={results} columns={columns} />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
