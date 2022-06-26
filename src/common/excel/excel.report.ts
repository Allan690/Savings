import * as ExcelJS from 'exceljs';
import * as tmp from 'tmp';

interface WorksheetColumns {
  header: string;
  key: string;
}

export async function generateReport(
  worksheetName: string,
  worksheetColumns: Array<WorksheetColumns>,
  data: Array<any>,
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(worksheetName);
  worksheet.columns = worksheetColumns;
  worksheet.columns.forEach((column) => {
    column.width = column.header.length < 12 ? 12 : column.header.length;
  });
  worksheet.getRow(1).font = { bold: true };
  data.forEach((e) => {
    worksheet.addRow({
      ...e,
    });
  });
  worksheet.eachRow({ includeEmpty: false }, function (_, rowNumber) {
    worksheet.getCell(`A${rowNumber}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      right: { style: 'none' },
    };

    const insideColumns = ['B', 'C', 'D'];

    insideColumns.forEach((v) => {
      worksheet.getCell(`${v}${rowNumber}`).border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        left: { style: 'none' },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        right: { style: 'none' },
      };
    });

    worksheet.getCell(`E${rowNumber}`).border = {
      top: { style: 'thin' },
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      left: { style: 'none' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  worksheet.getCell(`A${worksheet.rowCount}`).border = {
    top: { style: 'thin' },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    left: { style: 'none' },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    bottom: { style: 'none' },
    right: { style: 'thin' },
  };

  const totalCell = worksheet.getCell(`B${worksheet.rowCount}`);
  totalCell.font = { bold: false };
  totalCell.alignment = { horizontal: 'center' };
  worksheet.views = [
    { state: 'frozen', xSplit: 0, ySplit: 1, activeCell: 'B2' },
  ];
  const filePath = await new Promise((resolve, reject) => {
    tmp.file(
      {
        discardDescriptor: false,
        prefix: worksheetName,
        postfix: '.xlsx',
        mode: parseInt('0600', 8),
      },
      async (err, file) => {
        if (err) reject(err);
        console.log(`[EXCEL]`, `Generating ${file}`);
        await workbook.xlsx.writeFile(file).catch((err) => reject(err));
        resolve(file);
      },
    );
  });
  console.log(`[EXCEL]`, `Generated ${filePath}`);
  return filePath;
}
