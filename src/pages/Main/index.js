import React, { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import "./index.css";
import xlsx from "xlsx";

function Main() {
  const [displayText, setDisplayText] = useState(
    "파일을 첨부하고 '단어 추출하기'를 눌러주세요."
  );
  const [selectedFiles, setSelectedFiles] = useState();
  const [selectedLangs, setSelectedLangs] = useState();

  async function runOCR() {
    try {
      if (!selectedFiles) {
        throw "인식할 파일을 첨부해주세요.";
      }
      if (!selectedLangs) {
        throw "인식할 언어를 선택해주세요.";
      }
      if (selectedLangs.length >= 4) {
        throw "인식할 언어를 3개 이하로 선택해주세요.";
      }
      const langsOption = "kor+" + selectedLangs.join("+");
      const worker = createWorker({
        logger: (m) => {
          if (m) {
            console.log(m);
            if (
              m.progress > 0 &&
              m.progress < 1 &&
              m.status === "recognizing text"
            ) {
              console.log(m.progress);
              setDisplayText("Recognizing... " + m.progress + "%");
            } else if (m.progress === 1 && m.status === "recognizing text") {
              setDisplayText("Complete!");
            }
          }
        },
      });

      await worker.load();
      await worker.loadLanguage(langsOption);
      await worker.initialize(langsOption);
      let texts = "";

      for (let i = 0; i < selectedFiles.length; i++) {
        console.log("돌았음");
        let {
          data: { text },
        } = await worker.recognize(selectedFiles[i]);
        texts = texts + text;
      }

      return texts;
    } catch (error) {
      return alert(error);
    }
  }

  function handleCheckedLangs(e) {
    try {
      const checked = Array.from(
        document.getElementsByClassName("main-lang-checkboxes")[0].children
      );
      const langs = [];
      checked.forEach((lang) => {
        if (lang.nodeName === "INPUT" && lang.checked === true) {
          langs.push(lang.defaultValue);
        }
      });
      setSelectedLangs(langs);
      return;
    } catch (error) {}
  }

  // function convertTextToWords(text) {
  //   return;
  // }

  async function handleSubmit(e) {
    try {
      e.preventDefault();

      const text = await runOCR();
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
          /\+/g,
          /\=/g,
          /\//g,
          /\?/g,
          /\[/g,
          /\]/g,
          /\|/g,
          /\:/g,
          /[0-9]/g,
          /[ㄱ-ㅎ가-힣]/g,
        ];

        for (let i = 0; i < splited3.length; i++) {
          for (let j = 0; j < except.length; j++) {
            splited3[i] = splited3[i].replace(except[j], "").toLowerCase();
          }
        }
        if (splited3 !== []) {
          makeExcelFiles(splited3);
        } else {
          throw "유효한 단어들이 없습니다";
        }
      }
    } catch (error) {
      return alert(error);
    }
  }

  async function handleFileChange(e) {
    const selectedFiles = Array.from(e.target.files);

    setSelectedFiles(selectedFiles);
    return;
  }

  function makeExcelFiles(splitedText) {
    const words = [];

    splitedText.map((word) => {
      let temp = { spelling: word, mean: "" };
      words.push(temp);
    });
    const ws = xlsx.utils.json_to_sheet(words);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
    xlsx.writeFile(wb, "words.xlsx");
    return;
  }
  return (
    <div className="main-container">
      <div className="main-body-container">
        <form onSubmit={handleSubmit} className="main-submit-form">
          <input
            type="file"
            className="main-fileinput"
            accept="image/png, image/jpeg"
            multiple={true}
            onChange={handleFileChange}
          ></input>
          <div className="main-lang-checkboxes" onChange={handleCheckedLangs}>
            <input type="checkbox" value="eng"></input>
            <label>영어(English)</label>
            <input type="checkbox" value="rus"></input>
            <label>러시아어(Russian)</label>
            <input type="checkbox" value="fra"></input>
            <label>프랑스어(French)</label>
            <input type="checkbox" value="deu"></input>
            <label>독일어(German)</label>
            <input type="checkbox" value="spa"></input>
            <label>스페인어(Spanish)</label>
            <input type="checkbox" value="ita"></input>
            <label>이탈리아어(Italian)</label>
            <input type="checkbox" value="por"></input>
            <label>포르투갈어(Portuguese)</label>
            <input type="checkbox" value="nld"></input>
            <label>네덜란드어(Dutch)</label>
            <input type="checkbox" value="nor"></input>
            <label>노르웨이어(Norwegian)</label>
            <input type="checkbox" value="swe"></input>
            <label>스웨덴어(Swedish)</label>
          </div>
          <input
            type="submit"
            className="main-submit-button"
            value="단어 추출하기"
          ></input>
        </form>
        {displayText}
      </div>
    </div>
  );
}

export default Main;
