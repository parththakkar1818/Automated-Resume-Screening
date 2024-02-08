// import React, { useState } from "react";

// const Home = () => {
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [extractedText, setExtractedText] = useState("");
//   const [similarityscore, setsimilarityscore] = useState(0);

//   const handleFileChange = (event) => {
//     setSelectedFile(event.target.files[0]);
//   };

//   const uploadPDF = async () => {
//     if (!selectedFile) {
//       console.error("No file selected.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", selectedFile);

//     try {
//       const response = await fetch("http://localhost:8000/extract_text", {
//         method: "POST",
//         body: formData,
//       });
//       const data = await response.json();
//       // console.log(data);
//       setExtractedText(data.text); // Update extractedText state with the extracted text
//       setsimilarityscore(data.score);
//     } catch (error) {
//       console.error("Error:", error);
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-5xl font-bold underline m-9">Upload PDF</h1>
//       <input type="file" onChange={handleFileChange} />
//       <button onClick={uploadPDF}>Upload</button>
//       {extractedText && <div>{extractedText}</div>}{" "}
//       {similarityscore && <h1 className="bold ">Similarity Score: {similarityscore}</h1>}
//     </div>
//   );
// };

// export default Home;
import React, { useState } from 'react';
import { Upload, Button, Input, message, Progress, Card, Row, Col, List, Collapse, Badge } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { TextArea } = Input;
const { Panel } = Collapse;

const FileUpload = () => {
  const [extractedText, setExtractedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [similarityScore, setSimilarityScore] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [matchedData, setMatchedData] = useState([]);

  const handleUpload = (info) => {
    const { status, response } = info.file;
    if (status === 'done') {
      setExtractedText(response.text);
      setUploadedFileName(info.file.name);
      setErrorMessage('');
    } else if (status === 'error') {
      setErrorMessage('File upload failed.');
    }
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleCheckSimilarity = () => {
    if (!jobDescription || !extractedText) {
      setErrorMessage('Please enter job description and upload a PDF file.');
      return;
    }

    // API call to calculate similarity score
    fetch('http://localhost:8000/similarity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ job_description: jobDescription, extracted_text: extractedText }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setSimilarityScore(data.similarity_score);
        setErrorMessage('');
        console.log(data.matched_data);
        if (data.matched_data) {
          setMatchedData(data.matched_data);
        }
      })
      .catch((error) => {
        console.error('Error calculating similarity:', error);
        setErrorMessage('Error calculating similarity.');
      });
  };

  return (
    <div className="p-4">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Upload PDF" className="h-full">
            <Dragger
              name="file"
              action="http://localhost:8000/extract_text"
              onChange={handleUpload}
              accept=".pdf"
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to this area to upload</p>
              <p className="ant-upload-hint">Support for a single upload.</p>
            </Dragger>
            {uploadedFileName && <p>Uploaded File: {uploadedFileName}</p>}
            {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Job Description" className="h-full">
            <TextArea
              rows={4}
              placeholder="Enter job description"
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              className="mb-4"
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Collapse defaultActiveKey={['0']} accordion>
            <Panel header="Extracted Text" key="1" 
              className={ !extractedText ? 'bg-red-200' : 'bg-green-200'}
            >
              {
                !extractedText ? <p>null</p> : <p>{extractedText}</p>
              }
            </Panel>
          </Collapse>
          <Button className="mt-4" onClick={handleCheckSimilarity}>
            Check Similarity
          </Button>
        </Col>
        <Col span={24}>
          {similarityScore !== null && (
            <Card title="Similarity Score">
              <Progress type="circle" percent={similarityScore * 100} />
              {matchedData.length > 0 && (
                <Card title="Matched Data">
                  <List
                    bordered
                    dataSource={matchedData}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Card>
              )}
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default FileUpload;
