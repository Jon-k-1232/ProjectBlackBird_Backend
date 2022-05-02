const fs = require('fs');
const PDFDocument = require('./pdfkit-tables');
const AdmZip = require('adm-zip');
const { defaultPdfSaveLocation } = require('../config');

//www.youtube.com/watch?v=fKewAlUwRPk     ---- stream ---- does not save on server

// https://pdfkit.org/docs/text.html
// https://pspdfkit.com/blog/2019/generate-pdf-invoices-pdfkit-nodejs/
// https://stackabuse.com/generating-pdf-files-in-node-js-with-pdfkit/
// https://www.geeksforgeeks.org/how-to-convert-a-file-to-zip-file-and-download-it-using-node-js/
// https://thecodebarbarian.com/working-with-zip-files-in-node-js.html

const pdfAndZipFunctions = {
  zipCreate: async () => {
    const file = new AdmZip();
    file.addLocalFolder(defaultPdfSaveLocation);
    fs.writeFileSync(`${defaultPdfSaveLocation}/output.zip`, file.toBuffer());
    return 200;
  },

  pdfCreate: async arrayOfDataToCreate => {
    const folderPath = defaultPdfSaveLocation;

    // Makes directory if it does not exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    const pdfArr = [];

    arrayOfDataToCreate.forEach(s => {
      const doc = new PDFDocument({ size: 'A4' });
      doc.pipe(fs.createWriteStream(`${folderPath}/${s.firstName}${s.lastName}.pdf`));
      doc.fontSize(25).text(`Hello ${s.firstName}`, 100, 100);
      // pdfDoc.fontSize(27).text('This the article for GeeksforGeeks', 100, 100);
      doc.end();
      pdfArr.push(doc);
    });
    return 200;
  },

  //   zipCreate: async res => {
  //     const file = new AdmZip();
  //     file.addLocalFolder(defaultPdfSaveLocation);
  //     const data = fs.writeFileSync(`${defaultPdfSaveLocation}/output.zip`, file.toBuffer());

  //     // here we assigned the name to our downloaded file!
  //     const file_after_download = 'downloaded_file.zip';

  //     res.set('Content-Type', 'application/octet-stream');
  //     res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
  //     res.set('Content-Length', data.length);
  //     res.send(data);
  //   },
};

module.exports = pdfAndZipFunctions;
