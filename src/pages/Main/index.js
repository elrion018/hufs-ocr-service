import React, { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import "./index.css";

function Main() {
  const [splitedText, setSplitedText] = useState([]);
  const [displayText, setDisplayText] = useState("파일을 첨부해주세요.");
  const [selectedFile, setSelectedFile] = useState();

  async function doOCR() {
    try {
      const worker = createWorker({
        logger: (m) => console.log(m),
      });
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(selectedFile);

      return text;
    } catch (error) {
      alert("파일을 첨부해주세요.");
      return "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = await doOCR();

    try {
      if (text !== "") {
        let splited1 = text.split("\n");
        let splited2 = [];

        splited1.map((text) => {
          splited2 = splited2.concat(text.split(" "));
        });
        let splited3 = [...new Set(splited2)];
        let except = [
          /\"/g,
          /\'/g,
          /\“/g,
          /\”/g,
          /\,/g,
          /\./g,
          /\!/g,
          /\@/g,
          /\#/g,
          /\$/g,
          /\%/g,
          /\^/g,
          /\&/g,
          /\*/g,
          /\(/g,
          /\)/g,
          /\-/g,
          /\+/g,
          /\=/g,
          /\//g,
          /\?/g,
          /[ㄱ-ㅎ가-힣]/g,
        ];

        for (let i = 0; i < splited3.length; i++) {
          for (let j = 0; j < except.length; j++) {
            splited3[i] = splited3[i].replace(except[j], "");
          }
        }
        if (splited3 !== []) {
          setSplitedText(splited3);
        } else {
          throw "error";
        }
      }
    } catch (error) {
      alert("error");
    }
  }

  function handleDisplayText(splitedText) {
    setDisplayText(splitedText.join());
  }

  async function handleFileChange(e) {
    const selectedFile = e.target.files[0];
    setSelectedFile(selectedFile);
  }

  useEffect(() => {
    if (splitedText !== []) {
      handleDisplayText(splitedText);
    }
  }, [splitedText]);
  return (
    <div className="main-container">
      <div className="main-body-container">
        <form onSubmit={handleSubmit} className="main-submit-form">
          <input
            type="file"
            className="main-fileinput"
            accept="image/png, image/jpeg"
            onChange={handleFileChange}
          ></input>
          <input
            type="submit"
            className="main-submit-button"
            value="단어 추출하기"
          ></input>
          {displayText}
        </form>
      </div>
    </div>
  );
}

export default Main;
