import React, { useState } from "react";

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [similarityscore, setsimilarityscore] = useState(0);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const uploadPDF = async () => {
    if (!selectedFile) {
      console.error("No file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/extract_text", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      // console.log(data);
      setExtractedText(data.text); // Update extractedText state with the extracted text
      setsimilarityscore(data.score);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1 className="text-5xl font-bold underline m-9">Upload PDF</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={uploadPDF}>Upload</button>
      {extractedText && <div>{extractedText}</div>}{" "}
      {similarityscore && <h1 className="bold ">Similarity Score: {similarityscore}</h1>}
    </div>
  );
};

export default Home;
