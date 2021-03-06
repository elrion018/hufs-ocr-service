import React, { useState } from "react";
import { createWorker } from "tesseract.js";
import "./index.css";
import xlsx from "xlsx";
// import { ConvertPdfToImages } from "../../constants";

function Main() {
  const [displayText, setDisplayText] = useState(
    "파일을 첨부하고 원하는 기능의 버튼을 눌러주세요."
  );
  const [selectedFiles, setSelectedFiles] = useState();
  const [selectedLangs, setSelectedLangs] = useState();

  async function runOCR() {
    try {
      const langsOption = "kor+" + selectedLangs.join("+");
      const worker = createWorker({
        logger: (m) => {
          if (m) {
            if (
              m.progress > 0 &&
              m.progress < 1 &&
              m.status === "recognizing text"
            ) {
              setDisplayText(
                "Recognizing... " + (m.progress * 100).toFixed(0) + "%"
              );
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
        let {
          data: { text },
        } = await worker.recognize(selectedFiles[i]);
        texts = texts + text;
      }

      setDisplayText("Perfectly complete!");
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
    } catch (error) {
      return alert(error);
    }
  }

  function createTxtFile(texts) {
    try {
      let blob = new Blob([texts], { type: "text/plain" });
      let objURL = window.URL.createObjectURL(blob);

      if (window.__Xr_objURL_forCreatingFile__) {
        window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
      }
      window.__Xr_objURL_forCreatingFile__ = objURL;

      let a = document.createElement("a");
      a.download = "text";
      a.href = objURL;
      a.click();
      setDisplayText("Perfectly complete!");
    } catch (error) {
      return alert("텍스트파일 생성에 실패했습니다.");
    }
  }

  function convertTextToWords(text) {
    try {
      if (text === "") {
        throw "유효한 텍스트가 없습니다.";
      }

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
        /\</g,
        /\>/g,
        /\~/g,
        /\./g,
        /\`/g,
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
        /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g,
      ];
      const res = [];
      for (let i = 0; i < splited3.length; i++) {
        let temp = splited3[i];
        for (let j = 0; j < except.length; j++) {
          temp = temp.replaceAll(except[j], "");
        }
        if (temp !== "") {
          res.push(temp.toLowerCase());
        }
      }
      res.sort();
      return res;
    } catch (error) {
      return alert(error);
    }
  }

  async function handleSubmit(e) {
    try {
      e.preventDefault();

      if (!selectedFiles) {
        throw "인식할 파일을 첨부해주세요.";
      }

      if (!selectedLangs) {
        throw "인식할 언어를 선택해주세요.";
      }
      if (!selectedFiles.length > 3) {
        throw "파일은 3개 이하까지 첨부 가능합니다.";
      }

      if (selectedLangs.length >= 4) {
        throw "인식할 언어를 3개 이하로 선택해주세요.";
      }

      if (e.target.value === "Extracting words") {
        setDisplayText("잠시만 기다려주세요..");
        const text = await runOCR();
        if (text === "") {
          throw "본문 내용을 인식하지 못했습니다.";
        }
        const words = convertTextToWords(text);

        if (words.length !== 0) {
          makeExcelFiles(words);
        } else {
          throw "유효한 단어들이 없습니다";
        }
      } else {
        setDisplayText("잠시만 기다려주세요..");
        const text = await runOCR();
        if (text === "") {
          throw "본문 내용을 인식하지 못했습니다.";
        }
        createTxtFile(text);
      }
    } catch (error) {
      return alert(error);
    }
  }

  async function handleFileChange(e) {
    try {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 3) {
        throw "파일은 3개 이하까지 첨부 가능합니다.";
      }

      setSelectedFiles(selectedFiles);
      return;
    } catch (error) {
      return alert(error);
    }
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
        <div>
          <h1>한국외대생이 만든 간편 OCR 서비스 - Beta version</h1>
          <a href="https://namu.wiki/w/OCR" target="blank">
            OCR이란? 자세한 내용은 링크를 참조하세요.
          </a>
          <h3>사용법</h3>
          <p>
            1. 인식하길 원하는 이미지 파일들을 첨부한다.(복수 파일 선택 가능)
          </p>
          <p>2. 인식하길 원하는 언어들을 선택한다.(다중 언어 지원)</p>
          <p>
            3. 'Extracting words'(단어 추출하기)와 'Extracting text'(본문 내용
            추출하기) 중 원하는 서비스의 버튼을 누른다.
          </p>
          <p>
            4. 인식이 끝나길 기다렸다가 인식 내용을 담은 파일을 다운로드 받는다.
          </p>
          <h3>안내 및 주의사항</h3>
          <p>
            * 현재 웹사이트, Chrome 브라우저에 최적화되어있습니다. 가급적
            스마트폰, Internet Explorer으로 이용하지 마세요.
          </p>
          <p>
            * 현재 PDF 파일 형식의 파일들은 지원하지 않습니다. (다음 업데이트에
            지원하기 위해 열심히 개발 중.)
          </p>
          <p>
            * PDF 파일의 자료들은 필요한 부분을 이미지 캡처하여 png, jpg
            확장자의 파일로 만들어 사용하시길 바랍니다.
          </p>
          <p>* 현재 서양어대학에서 쓰이는 언어들만 지원하고 있습니다.</p>
          <p>
            * 많은 언어를 선택하여 인식하게 되면 인식률이 떨어지므로 언어 선택을
            3개 이하로 제한하고 있습니다.
          </p>
          <p>
            * 문자가 흐릿한 이미지, 기울어진 이미지, 문자 외 다른 요소가 많은
            이미지, 정자체와 거리가 먼 문자 등은 당연하게도 인식률의 큰 저하를
            가져옵니다.
          </p>
          <p>
            * 'Extracting words'(단어 추출하기) 기능의 경우, 인식한 단어를
            고스란히 가져올 뿐 표제어로 바꿔주지 않습니다. 양해 바랍니다. 추후
            각 언어의 전공지식으로 표제어로 바꾸는데 도움을 주실 분들을 모을
            생각입니다.
          </p>
          <p>
            * 'Extracting words'(단어 추출하기) 기능의 경우, 한글은 모두
            제외시킵니다.
          </p>
          <p>
            * 등록하신 파일은 따로 저장하지 않습니다. 안심하시고 쓰셔도 됩니다.
          </p>
          <p>
            * 마지막으로, 버그리포팅, 의견 제시 및 기타 사항은
            elrion018@gmail.com 으로 연락해주세요.
          </p>
          <p>
            * Developer profile :{" "}
            <a href="https://github.com/elrion018" target="blank">
              https://github.com/elrion018
            </a>{" "}
            (교류, 프로젝트 협업 요청 환영)
          </p>
        </div>
        <h3>파일 선택(png, jpg 확장자를 가진 이미지 파일)</h3>
        <input
          type="file"
          className="main-fileinput"
          accept="image/png, image/jpeg"
          multiple={true}
          onChange={handleFileChange}
        ></input>
        <h3>인식 언어 선택(최대 3개 언어까지 선택 가능)</h3>
        <div className="main-lang-checkboxes" onChange={handleCheckedLangs}>
          <h4>서양어</h4>
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
          <h4>동양어</h4>
          <input type="checkbox" value="chi_sim"></input>
          <label>중국어 간체(Chinese - Simplified)</label>
          <input type="checkbox" value="chi_tra"></input>
          <label>중국어 번체(Chinese - Traditional)</label>
          <input type="checkbox" value="jpn"></input>
          <label>일본어(Japanese)</label>
          <input type="checkbox" value="ind"></input>
          <label>인도네시아어(Indonesian)</label>
          <input type="checkbox" value="vie"></input>
          <label>베트남어(Vietnamese)</label>
          <input type="checkbox" value="san"></input>
          <label>인도어(산스크리트, Sanskrit)</label>
          <input type="checkbox" value="tur"></input>
          <label>터키어(Turkish)</label>
          <input type="checkbox" value="fas"></input>
          <label>이란어(Persian)</label>
          <input type="checkbox" value="aze"></input>
          <label>아제르바이잔어(Azerbaijani)</label>
          <input type="checkbox" value="aze_cyrl"></input>
          <label>아제르바이잔어(Azerbaijani - Cyrillic)</label>
          <input type="checkbox" value="ara"></input>
          <label>아랍어(Arabic)</label>
        </div>

        <input
          type="submit"
          className="main-submit-extractor-button"
          value="Extracting words"
          onClick={handleSubmit}
        ></input>
        <input
          type="submit"
          className="main-submit-reading-button"
          value="Extracting text"
          onClick={handleSubmit}
        ></input>

        {displayText}
      </div>
    </div>
  );
}

export default Main;
