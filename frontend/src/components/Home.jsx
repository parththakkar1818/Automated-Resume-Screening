import React, { useState } from "react";
import {
  Upload,
  Button,
  Table,
  Spin,
  message,
  Tag,
  Select,
  Collapse,
  Progress,
} from "antd";
import {
  UploadOutlined,
  TagOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { Panel } = Collapse;

const Home = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 }); // Define pagination state
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [allMails, setAllMails] = useState([]);
  

  const handleFileChange = (info) => {
    setSelectedFiles(info.fileList);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.value);
  };

  const handleSkillChange = (value) => {
    setSkills(value);
  };

  const handleExpand = (expanded, record) => {
    const expandedKeys = expanded
      ? [record.key]
      : expandedRowKeys.filter((key) => key !== record.key);
    setExpandedRowKeys(expandedKeys);
  };

  const uploadPDFs = async () => {
    if (selectedFiles.length === 0) {
      console.error("No files selected.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("resume_files", file.originFileObj);
    }
    formData.append("job_description", jobDescription);
    formData.append("recruiter_skills", JSON.stringify(skills));

    try {
      const response = await fetch("http://localhost:8000/extract_and_sort", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      const filenames = data.map((item) => item.filename);
      setAllFiles([ ...allFiles, ...filenames]);
      const mails = data
        .map((item) => item.user_mail)
        .filter((mail) => mail !== null && mail.endsWith("@gmail.com"));
      setAllMails([...allMails, ...mails]);

      
      console.log("All mail name: ", allMails);
      console.log("All files name: ",allFiles);

      setResults(data);
    } catch (error) {
      console.error("Error:", error);
      message.error("An error occurred while processing files.");
    }

    setLoading(false);
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(
        `http://localhost:8000/download/${filename}`,
        {
          method: "POST",
          responseType: "blob",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      message.error("Failed to download PDF");
    }
  };

  const handleDownloadAll = async () => {
    try {
      console.log("in download function for stringify",JSON.stringify(allFiles));
      const response = await fetch("http://localhost:8000/download-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(allFiles),
      });
      if (!response.ok) {
        throw new Error("Failed to download PDFs");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "downloaded_files.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDFs:", error);
      message.error("Failed to download PDFs");
    }
  };

  const sendMail = async () => {
    try {
      const allEmails = allMails.map((mail) => mail).join(";");
      console.log(allEmails);
      const mailtoLink = `mailto:${allEmails}`;
      const link = document.createElement("a");
      link.href = mailtoLink;
      link.target = "_blank"; // Open link in new tab
      link.click(); // Simulate a click on the anchor element
    } catch (error) {
      console.error("Error sending mail:", error);
      message.error("Failed to send mail");
    }

  }
  const renderSkills = (matchedSkills, unmatchedSkills) => {
    // console.log("from here matched: ", matchedSkills);
    // console.log("from here unmatched : ", matchedSkills);

    return (
      <div>
        {matchedSkills.map((skill, index) => (
          <Tag key={index} color="green">
            {skill}
          </Tag>
        ))}
        {unmatchedSkills.map((skill, index) => (
          <Tag key={index} color="red">
            {skill}
          </Tag>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: "Filename",
      dataIndex: "filename",
      key: "filename",
    },
    {
      title: "Similarity",
      dataIndex: "score",
      key: "score",
      render: (score) => <Progress percent={(score * 100).toFixed(2)} />,
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
        <Button onClick={uploadPDFs} className="ml-4" loading={loading}>
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
          style={{ width: "10%" }}
          placeholder="Add skills"
          value={skills}
          onChange={handleSkillChange}
          className="flex-grow"
        >
          {/* Add options dynamically from skills state */}
          {/* <Option key="Skill1">Skill1</Option>
          <Option key="Skill2">Skill2</Option>
          <Option key="Skill3">Skill3</Option> */}
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
          <button onClick={handleDownloadAll}>Download all</button>
          <button onClick={sendMail}>Send mail</button>
          <Table
            dataSource={results}
            columns={columns}
            pagination={{
              ...pagination,
              total: results.length,
              onChange: handlePaginationChange,
            }}
            expandedRowKeys={expandedRowKeys}
            onExpand={handleExpand}
            expandable={{
              expandedRowRender: (record) => (
                <Collapse>
                  <Panel header="Details" key="1">
                    <p>
                      <strong>Text:</strong> {record.text}
                    </p>
                    <p>
                      <strong>Matched Skills: </strong>
                    </p>
                    {renderSkills(
                      record.matched_skills,
                      record.unmatched_skills
                    )}
                  </Panel>
                </Collapse>
              ),
              rowExpandable: (record) => !!record.text,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
