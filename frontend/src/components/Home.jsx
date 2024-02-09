import React, { useState } from "react";

const Home = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [results, setResults] = useState([]);

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const uploadPDFs = async () => {
    if (selectedFiles.length === 0) {
      console.error("No files selected.");
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append("resume_files", file); // Use "resume_files" as the key
    }

    try {
      const response = await fetch("http://localhost:8000/extract_and_sort", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };


  return (
    <div className="p-8">
      <h1 className="text-5xl font-bold underline mb-8">Upload PDFs</h1>
      <input type="file" multiple onChange={handleFileChange} />
      <button
        onClick={uploadPDFs}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Upload
      </button>
      {results.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Results:</h2>
          <ul>
            {results.map((result, index) => (
              <li key={index} className="mb-4">
                <h3 className="text-xl font-bold">{result.filename}</h3>
                <p>{result.score}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
