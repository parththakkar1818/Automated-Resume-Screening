import React, { useState ,useRef,useEffect} from "react";
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
  Tooltip,
  Input,
  InputNumber,
  Tour
} from "antd";
import {
  UploadOutlined,
  TagOutlined,
  DownloadOutlined,
  MailTwoTone,
  OrderedListOutlined,
  NumberOutlined,
} from "@ant-design/icons";
const { TextArea } = Input;
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
  const [open, setOpen] = useState(false);

  

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);
  const ref5 = useRef(null);

  const steps = [
    {
      title: "Job Description",
      description: "Enter job description here",
      target: () => ref1.current,
      nextButtonProps: {type:"dashed" ,children:"Next"}
    },
    {
      title: "Skills",
      description: "Add required skills here",
      target: () => ref2.current,
      nextButtonProps: {type:"dashed" ,children:"Next"}
    },
    {
      title: "Number of Candidates",
      description: "Enter number of candidates here",
      target: () => ref3.current,
      nextButtonProps: {type:"dashed" ,children:"Next"}
    },
    {
      title: "Select PDFs",
      description: "Click here to select PDF files",
      target: () => ref4.current,
      nextButtonProps: {type:"dashed" ,children:"Next"}
    },
    {
      title: "Upload",
      description: "Upload selected files",
      target: () => ref5.current,
      nextButtonProps: {type:"dashed" ,children:"Finish"}
    },
  ];

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
      {/* <Button onClick={() => setOpen(true)}>
        Begin Tour
      </Button> */}
      <div className="flex justify-center items-center mb-4">
        <Upload
          
          multiple
          onChange={handleFileChange}
          fileList={selectedFiles}
          showUploadList={{ showRemoveIcon: true }}
          customRequest={() => {}}
          beforeUpload={() => false}
        >
          <Button icon={<UploadOutlined />} ref={ref4}>Select PDFs</Button>
        </Upload>
        <Button ref={ref5} onClick={uploadPDFs} className="ml-4" loading={loading} >
          Upload
        </Button>
      </div>
      <div className="flex items-center mb-4 space-x-4">
        <div ref={ref1} className="w-3/5">

          <TextArea
            // ref={ref1}
            title="Job  Description"
            className="border border-gray-300 rounded"
            type="text"
            placeholder="Enter job description"
            value={jobDescription}
            onChange={handleJobDescriptionChange}
            rows={10}
          />
        </div>

        <div ref={ref2} className="w-2/5">

          <OrderedListOutlined className="text-xl mr-2" />
          <span className="text-lg font-semibold mr-2" >Skills:</span>
          <Select
            
            mode="tags"
            style={{ width: "80%" }}
            placeholder="Add skills"
            value={skills}
            onChange={handleSkillChange}
            className="flex-grow"
          >
          </Select>
        </div>
      </div>
      <div ref={ref3} className="flex mt-6 text-lg font-semibold mr-2 items-center justify-center mx-auto">
        <NumberOutlined className="mr-2" />
        <span className="mr-2">Number of candidates: </span>  
        <InputNumber min={1} defaultValue={1}/>
      </div>
      {loading && (
        <div className="mt-8 text-center">
          <Spin tip="Processing files..." size="large" />
        </div>
      )}
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex justify-center">
            Results
          </h2>
          {/* <Button onClick={uploadPDFs} className="ml-4" loading={loading}>
          Upload
          </Button> */}
          {/* <button onClick={handleDownloadAll}>Download all</button> */}
          <div className="mb-9 mt-5 flex justify-center items-center">
            <Button onClick={handleDownloadAll} className="mr-5 ">
              <Tooltip title="Download all best suited Resumes">

                <DownloadOutlined className=" align-middle mb-1 mr-2"/>
                Download All
              </Tooltip>
            </Button>
            <Button onClick={sendMail} className="">
            <Tooltip title="Mail selected candidates">

              <MailTwoTone className=" align-middle mb-1 mr-2" />
              Send Mail
            </Tooltip>
            </Button>
          </div>
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
      <Tour
        steps={steps}
        isOpen={open}
        onRequestClose={() => setOpen(false)}
      />
    </div>
  );
};

export default Home;
