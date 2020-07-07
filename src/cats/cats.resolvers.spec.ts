import { Test, TestingModule } from '@nestjs/testing'
import { CatsService } from './cats.service'
import { Cat } from './cat.model'
import { CatsResolvers } from './cats.resolvers'
import { SequelizeModule } from '@nestjs/sequelize'
import { CatsModule } from './cats.module'
import { resolve } from 'path'
import { config } from 'dotenv'

describe('CatsResolver', () => {
  let app: TestingModule
  let catsResolver: CatsResolvers
  const cat1: Partial<Cat> = {}
  cat1.name = 'Nick Name 1'
  cat1.age = 2

  const cat2: Partial<Cat> = {}
  cat2.name = 'Nick Name 2'
  cat2.age = 5

  let id = 0

  beforeAll(() => {
    const envFile =
      '.env' +
      (process.env.NODE_ENV !== 'prod' ? '.' + process.env.NODE_ENV : '')
    const path = '../../' + envFile
    console.log(`Reading configuration from ${envFile}`)
    config({ path: resolve(__dirname, path) })
  })

  beforeEach(async () => {
    app = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'mysql',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_SCHEMA,
          autoLoadModels: true,
          synchronize: true,
        }),
        CatsModule,
      ],
      providers: [
        {
          provide: CatsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([cat1, cat2]),
            findOne: jest.fn().mockResolvedValue(cat1),
            create: jest
              .fn()
              .mockImplementation((cat: Cat) => Promise.resolve(cat)),
            remove: jest.fn().mockResolvedValue(null),
          },
        },
        CatsResolvers,
      ],
    }).compile()

    catsResolver = app.get<CatsResolvers>(CatsResolvers)
  })

  afterEach(async () => {
    app.close()
  })

  describe('CR-D', () => {
    it('create()', async () => {
      await expect(
        catsResolver.create({
          name: cat1.name,
          age: cat1.age,
        })
      ).resolves.toMatchObject(cat1)
      await expect(
        catsResolver.create({
          name: cat2.name,
          age: cat2.age,
        })
      ).resolves.toMatchObject(cat2)
    })

    it('findAll()', async () => {
      const allCats = await catsResolver.getCats()
      await expect(allCats[0].name).toEqual(cat1.name)
      await expect(allCats[0].age).toEqual(cat1.age)
      await expect(allCats[1].name).toEqual(cat2.name)
      await expect(allCats[1].age).toEqual(cat2.age)
      id = allCats[0].id
    })

    it('findOne()', async () => {
      const cat = await catsResolver.findOne(id)
      await expect(cat.name).toEqual(cat1.name)
      await expect(cat.age).toEqual(cat1.age)
    })
  })
})
