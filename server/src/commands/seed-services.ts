import { Command, CommandRunner, Option } from 'nest-commander';
import { ServiceService } from '../service/service.service';
import { CategoryService } from '../category/category.service';
import { JobService } from 'src/job/job.service';

@Command({ name: 'services' })
export class ServiceSeedCommandRunner implements CommandRunner {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: ServiceService,
    private readonly serviceService: JobService,
  ) {}

  async run(
    passedParams: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    try {
      const SEED_DATA = [
        {
          name: 'Car Wash',
          description:
            'Seekers will be able to ask for car wash services and providers will be able to serve seekers.',
          services: [
            {
              name: 'Basic',
              description:
                'Basic wash service includes service packages that your car may need on a regular basis. This package is best for the cars that are used regularly for office or after a short trip.',
              jobs: [
                {
                  name: 'Interior vacuumed',
                  description:
                    'Interior vacuumed cleaning includes wipe down of the interior surfaces, carpets and upholsteries. We don’t just vacuum up the dirt and debris sitting on the surface but make sure to get all the sand, dust and debris removed properly.',
                },
                {
                  name: 'Dashboard and door jambs wiped',
                  description:
                    'Professionals will first remove all dirt, scrub with the brush and rinse to stop scraping on the car paint. After that the surface will be wiped off with either microfiber cloth or air blow gun to perform the drying process rapidly. Steam cleaner will be used particularly for cleaning difficult-to-reach regions of door jambs. Wax is applied as the outermost layer to achieve beautifully shining looks.',
                },

                {
                  name: 'Windows cleaned',
                  description:
                    'Windows will be washed first using soap and water scrubbing from top-to-bottom to make sure that they are clear of dirt and grime. After that clear water is applied to rinse and a microfiber towel is used to dry the windows by wiping in up-and-down and side-to-side motion to avoid streaks. Glass cleaner is used to clean glasses further and finally glass treatment is applied to windshields and side windows.',
                },

                {
                  name: 'Under the hood cleaning',
                  description:
                    'Engine will be allowed to cool down if required flipping the hood for sometime. Plastic covers are removed and scrubbed separately. Entire engine compartment is thoroughly sprayed with  engine degreaser. After applying degreaser each and every component  is scrubbed to wipe out dirt and even valve cover that may have years of caked-on oil and dirt. After that the area is properly rinsed using clear water and dried by applying a microfiber towel.',
                },
              ],
            },
            {
              name: 'Medium',
              description:
                'This wash service will be best for regular long distance commuters or after a week long trip.',
              jobs: [
                {
                  name: 'Buffing a vehicle',
                  description:
                    'Buffing a vehicle starts with chemical free cleaning followed by steam cleaning. After that the surface will be wiped off with a microfiber towel. Clay bar is then applied to remove if there are any remaining minute contaminants on the surface. Applicator pad with polish is applied after in circular motion on the surface and finally rinsed and dried.',
                },
                {
                  name: 'Brightening wheels',
                  description:
                    'Wheels are washed applying clean water first and dried. After that a diluted wheel brightener is applied in and between every spock of the wheel. Then clean water is applied to wash it properly making the wheel books beautiful and bright.',
                },
                {
                  name: 'Shining of tires',
                  description:
                    'Process starts with washing all tires with water and a tire cleaner shoap . After all tires are properly cleaned, a dedicated tire cleaner is applied for beautiful and shining looks. Finally, the tires are rinsed and dried.',
                },
                {
                  name: 'Interior vacuumed',
                  description:
                    'Interior vacuumed cleaning includes wipe down of the interior surfaces, carpets and upholsteries. We don’t just vacuum up the dirt and debris sitting on the surface but make sure to get all the sand, dust and debris removed properly.',
                },
                {
                  name: 'Dashboard and door jambs wiped',
                  description:
                    'Professionals will first remove all dirt, scrub with the brush and rinse to stop scraping on the car paint. After that the surface will be wiped off with either microfiber cloth or air blow gun to perform the drying process rapidly. Steam cleaner will be used particularly for cleaning difficult-to-reach regions of door jambs. Wax is applied as the outermost layer to achieve beautifully shining looks.',
                },
                {
                  name: 'Windows cleaned',
                  description:
                    'Windows will be washed first using soap and water scrubbing from top-to-bottom to make sure that they are clear of dirt and grime. After that clear water is applied to rinse and a microfiber towel is used to dry the windows by wiping in up-and-down and side-to-side motion to avoid streaks. Glass cleaner is used to clean glasses further and finally glass treatment is applied to windshields and side windows.',
                },
                {
                  name: 'Under the hood cleaning',
                  description:
                    'Engine will be allowed to cool down if required flipping the hood for sometime. Plastic covers are removed and scrubbed separately. Entire engine compartment is thoroughly sprayed with  engine degreaser. After applying degreaser each and every component  is scrubbed to wipe out dirt and even valve cover that may have years of caked-on oil and dirt. After that the area is properly rinsed using clear water and dried by applying a microfiber towel.',
                },
              ],
            },
            {
              name: 'Ultra',
              description:
                'This service is best recommended for frequent commuters to have once on every change in season.',
              jobs: [
                {
                  name: 'Undercarriage wash',
                  description:
                    'High pressure water jet with detergent is applied for undercarriage wash. As per the need, rust protection will be applied after undercarriage is dried.',
                },
                {
                  name: 'Bluffing a vehicle',
                  description:
                    'Buffing a vehicle starts with chemical free cleaning followed by steam cleaning. After that the surface will be wiped off with a microfiber towel. Clay bar is then applied to remove if there are any remaining minute contaminants on the surface. Applicator pad with polish is applied after in circular motion on the surface and finally rinsed and dried.',
                },
                {
                  name: 'Brightening wheels',
                  description:
                    'Wheels are washed applying clean water first and dried. After that a diluted wheel brightener is applied in and between every spock of the wheel. Then clean water is applied to wash it properly making the wheel books beautiful and bright.',
                },
                {
                  name: 'Shining of tires',
                  description:
                    'Process starts with washing all tires with water and a tire cleaner shoap . After all tires are properly cleaned, a dedicated tire cleaner is applied for beautiful and shining looks. Finally, the tires are rinsed and dried.',
                },
                {
                  name: 'Interior vacuumed',
                  description:
                    'Interior vacuumed cleaning includes wipe down of the interior surfaces, carpets and upholsteries. We don’t just vacuum up the dirt and debris sitting on the surface but make sure to get all the sand, dust and debris removed properly.',
                },
                {
                  name: 'Dashboard and door jambs wiped',
                  description:
                    'Professionals will first remove all dirt, scrub with the brush and rinse to stop scraping on the car paint. After that the surface will be wiped off with either microfiber cloth or air blow gun to perform the drying process rapidly. Steam cleaner will be used particularly for cleaning difficult-to-reach regions of door jambs. Wax is applied as the outermost layer to achieve beautifully shining looks.',
                },
                {
                  name: 'Windows cleaned',
                  description:
                    'Windows will be washed first using soap and water scrubbing from top-to-bottom to make sure that they are clear of dirt and grime. After that clear water is applied to rinse and a microfiber towel is used to dry the windows by wiping in up-and-down and side-to-side motion to avoid streaks. Glass cleaner is used to clean glasses further and finally glass treatment is applied to windshields and side windows.',
                },
                {
                  name: 'Under the hood cleaning',
                  description:
                    'Engine will be allowed to cool down if required flipping the hood for sometime. Plastic covers are removed and scrubbed separately. Entire engine compartment is thoroughly sprayed with  engine degreaser. After applying degreaser each and every component  is scrubbed to wipe out dirt and even valve cover that may have years of caked-on oil and dirt. After that the area is properly rinsed using clear water and dried by applying a microfiber towel.',
                },
              ],
            },
          ],
        },
      ];
      for (const category of SEED_DATA) {
        const { name, description, services } = category;
        let c = await this.categoryService.getCategoryByName(name);
        if (!c) {
          console.log(
            '🚀 ~ file: seed-services.ts ~ line 150 ~ SeedCommand ~ c',
            c,
          );
          // creating category
          c = await this.categoryService.createCategory({
            name,
            description,
          });
        }
        for (const service of services) {
          const { name, description, jobs } = service;
          let serv = await this.subcategoryService.getServiceByName(name);
          if (!serv) {
            serv = await this.subcategoryService.createService({
              name,
              description,
              categoryId: c._id,
            });
          }
          for (const job of jobs) {
            const { name, description } = job;
            let j = await this.serviceService.getJobByName(name);
            if (!j) {
              j = await this.serviceService.createJob({
                name,
                description,
                isDefault: true,
                businessId: null,
              });
            }
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  @Option({ flags: '-n <personName>' })
  parseName(val: string) {
    return val;
  }

  @Option({ flags: '-a <age>' })
  parseAge(val: string) {
    return Number.parseInt(val, 10);
  }
}
