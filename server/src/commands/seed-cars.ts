import * as csv from 'fast-csv';
import * as fs from 'fs';
import { Command, CommandRunner, Option } from 'nest-commander';
import { join, resolve } from 'path';
import { CarMetadataService } from 'src/car-metadata/car-metadata.service';

@Command({ name: 'cars' })
export class SeedCar implements CommandRunner {
  constructor(private readonly carMetadataSerive: CarMetadataService) {}
  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    const CSV_FOLDER_PATH = join(__dirname, '..', '..', 'csvs');
    const files = await this.listDirectory(CSV_FOLDER_PATH);
    const csvFiles = files.filter((file) => file.search('csv$'));
    for (const csvFile of csvFiles) {
      const cars = await this.getDataFromCsv(CSV_FOLDER_PATH, csvFile);
      await this.carMetadataSerive.insertManyCarMetadata(cars);
    }
  }
  async listDirectory(path: string): Promise<Array<string>> {
    console.log(
      '🚀 ~ file: seed-cars.ts ~ line 23 ~ SeedCar ~ listDirectory ~ path',
      path,
    );
    return new Promise((resolve, reject) =>
      fs.readdir(path, (err, files) => {
        if (err) {
          reject(err);
        }
        resolve(files);
      }),
    );
  }
  async getDataFromCsv(folderPath, filePath) {
    const cars = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(`${folderPath}/${filePath}`, 'utf-8')
        .pipe(csv.parse({ headers: true }))
        .on('data', async (data) => {
          const { make, model, year, body_styles: bodyStyles } = data;
          if (typeof bodyStyles === 'string') {
            const parsedBodyStyles = bodyStyles
              .replace(/\[/g, '')
              .replace(/\]/g, '')
              .replace(/\"/g, '')
              .split(',')
              .map((bodyStyle) => {
                const trimmedBodyStyle = bodyStyle.trim();
                cars.push({
                  make: make.trim(),
                  model: model.trim(),
                  year: parseInt(year).toString(),
                  bodyStyles: trimmedBodyStyle,
                });
              });
            // cars.push({
            //   make: make.trim(),
            //   model: model.trim(),
            //   year: parseInt(year).toString(),
            //   bodyStyles: parsedBodyStyles,
            // });
          } else {
            throw new Error('Cannot convert to array');
          }
        })
        .on('end', (rowCount) => resolve(cars));
    });
  }
}
