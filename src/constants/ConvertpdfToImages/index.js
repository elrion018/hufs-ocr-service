// const pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;
const PDFJS = pdfjsLib;

async function ConvertPdfToImages() {
  const createCanvas = (width, height) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    return [canvas, context];
  };
  const imageDataToDataURL = (imageData) => {
    const [canvas, context] = createCanvas(imageData.width, imageData.height);
    context.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };
  const getPaddedImageData = (imageData, alpha = 255) => {
    const { width, height, data } = imageData;
    const size = width * height;

    if (data.length === size * 4) {
      return new ImageData(data, width, height);
    }
    if (data.length !== size * 3) {
      throw new Error("Unknown image data format!");
    }

    const paddedData = new Uint8ClampedArray(size * 4).map((x, i) =>
      (i & 3) !== 3 ? data[(i >> 2) * 3 + (i & 3)] : alpha
    );
    return new ImageData(paddedData, width, height);
  };

  const appendImage = ({ imgData, objId, left, top, width, height }) => {
    images.push({
      url: imageDataToDataURL(getPaddedImageData(imgData)),
      naturalWidth: imgData.width,
      naturalHeight: imgData.height,
      objId,
      left,
      top,
      width,
      height,
    });
  };

  const getImagesFromPage = (
    doc,
    pageNum,
    { beginLayout, endLayout, appendImage }
  ) => {
    doc.getPage(pageNum).then((page) => {
      const imageLayer = {
        beginLayout,
        endLayout,
        appendImage: ({ imgData, objId, left, top, width, height }) => {
          if (!imgData) {
            const img = page.objs.get(objId);
            const [canvas, context] = createCanvas(
              img.naturalWidth,
              img.naturalHeight
            );
            context.drawImage(img, 0, 0);
            imgData = context.getImageData(
              0,
              0,
              img.naturalWidth,
              img.naturalHeight
            );
            if (!imgData) {
              alert("No image data!");
              throw new Error("No image data!");
            }
            top -= height;
          }

          appendImage({ imgData, objId, left, top, width, height });
        },
      };
      const viewport = page.getViewport({ scale: 1 });
      const [canvas, canvasContext] = createCanvas(
        viewport.width,
        viewport.height
      );

      page.render({
        imageLayer,
        viewport,
        canvasContext,
      });
    });
  };

  const getImagesFromDocument = (doc, appendImage) => {
    return Promise.all(
      [...new Array(doc.numPages)].map(
        (x, i) =>
          new Promise((resolve, reject) => {
            getImagesFromPage(doc, i + 1, {
              beginLayout: () => {},
              endLayout: resolve,
              appendImage,
            });
          })
      )
    );
  };

  const images = [];
  const URL =
    "/content/dam/esrisites/sitecore-archive/Files/Pdfs/library/bestpractices/what-is-gis.pdf";
  const doc = await PDFJS.getDocument({
    url: URL,
  }).promise;

  await getImagesFromDocument(doc, appendImage);
  for (let i = 0; i < images.length; i++) {
    images[i] = new File(images[i], "image.png", {
      type: "image/png",
    });
  }
}

export default ConvertPdfToImages;
