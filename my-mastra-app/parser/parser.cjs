// parsePDFs.js (Already completed with the parsing, parsed files in parsed folder)

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const folderPath = './data/berkshireLetters'; // Folder containing the downloaded letters

const parsedPath = './parsed';
if (!fs.existsSync(parsedPath)) {
    fs.mkdirSync(parsedPath);
}

async function parsePDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

async function parseAllPDFs() {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        if (path.extname(file).toLowerCase() === '.pdf') {
            const fullPath = path.join(folderPath, file);
            const text = await parsePDF(fullPath);
            fs.writeFileSync(
                path.join('./parsed', `${path.basename(file, '.pdf')}.txt`),
                text
            );
            console.log(`Parsed: ${file}`);
        }
    }
}

parseAllPDFs();
