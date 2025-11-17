import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create Text summarizer tool
  const textSummarizerTool = await prisma.tool.upsert({
    where: { name: 'Text summarizer' },
    update: {},
    create: {
      name: 'Text summarizer',
      description: 'Summarize text content',
    },
  })

  console.log('Created tool:', textSummarizerTool)

  // Create Text to Image tool
  const textToImageTool = await prisma.tool.upsert({
    where: { name: 'Text to Image' },
    update: {},
    create: {
      name: 'Text to Image',
      description: 'Generate images from text prompts using AI',
    },
  })

  console.log('Created tool:', textToImageTool)

  // Create Character Consistent Image tool
  const characterConsistentImageTool = await prisma.tool.upsert({
    where: { name: 'Character Consistent Image' },
    update: {},
    create: {
      name: 'Character Consistent Image',
      description: 'Generate images with consistent character appearance using reference image',
    },
  })

  console.log('Created tool:', characterConsistentImageTool)

  // Create Leonardo AI models for character-consistent image generation
  const models = [
    {
      name: 'Leonardo Lightning XL',
      modelId: 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      styleControl: 'presetStyle',
      contrastRequired: false,
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Leonardo Kino XL',
      modelId: 'aa77f04e-3eec-4034-9c07-d0f619684628',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      styleControl: 'presetStyle',
      contrastRequired: false,
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Leonardo Vision XL',
      modelId: '5c232a9e-9061-4777-980a-ddc8e65647c6',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      styleControl: 'presetStyle',
      contrastRequired: false,
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Leonardo Anime XL',
      modelId: 'e71a1c2f-4f80-4800-934f-2c68979d8cc8',
      preprocessorId: 133,
      photoRealAvailable: true,
      photoRealDefault: true,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      styleControl: 'presetStyle',
      contrastRequired: false,
      isActive: true,
      displayOrder: 4,
    },
    {
      name: 'Leonardo Phoenix',
      modelId: 'de7d3faf-762f-48e0-b3b7-9d0ac3a3fcf3',
      preprocessorId: 397,
      photoRealAvailable: false,
      photoRealDefault: false,
      photoRealVersion: 'v2',
      alchemyAvailable: true,
      alchemyDefault: true,
      styleControl: 'styleUUID',
      contrastRequired: true,
      contrastDefault: 3.0,
      isActive: true,
      displayOrder: 5,
    },
  ]

  for (const model of models) {
    const leonardoModel = await prisma.leonardoModel.upsert({
      where: { modelId: model.modelId },
      update: {},
      create: model,
    })
    console.log('Created Leonardo model:', leonardoModel.name)
  }

  // Create Leonardo Style Control options for presetStyle
  const presetStyleOptions = [
    'CINEMATIC',
    'CREATIVE',
    'GENERAL',
    'ENVIRONMENT',
    'PORTRAIT',
    'ANIME',
    'LEONARDO',
    'LEONARDO_ANIME',
    'VIBRANT',
  ]

  for (let i = 0; i < presetStyleOptions.length; i++) {
    const styleControl = await prisma.leonardoStyleControl.upsert({
      where: {
        styleControlParam_styleOption: {
          styleControlParam: 'presetStyle',
          styleOption: presetStyleOptions[i],
        },
      },
      update: {},
      create: {
        styleControlParam: 'presetStyle',
        styleOption: presetStyleOptions[i],
        displayOrder: i + 1,
      },
    })
    console.log('Created presetStyle option:', styleControl.styleOption)
  }

  // Create Leonardo Style Control options for styleUUID (Phoenix model)
  const styleUuidOptions = [
    { label: '3D Render', uuid: 'debdf72a-91a4-467b-bf61-cc02bdeb69c6' },
    { label: 'Bokeh', uuid: '9fdc5e8c-4d13-49b4-9ce6-5a74cbb19177' },
    { label: 'Cinematic', uuid: 'a5632c7c-ddbb-4e2f-ba34-8456ab3ac436' },
    { label: 'Cinematic Concept', uuid: '33abbb99-03b9-4dd7-9761-ee98650b2c88' },
    { label: 'Creative', uuid: '6fedbf1f-4a17-45ec-84fb-92fe524a29ef' },
    { label: 'Dynamic', uuid: '111dc692-d470-4eec-b791-3475abac4c46' },
    { label: 'Fashion', uuid: '594c4a08-a522-4e0e-b7ff-e4dac4b6b622' },
    { label: 'Graphic Design Pop Art', uuid: '2e74ec31-f3a4-4825-b08b-2894f6d13941' },
    { label: 'Graphic Design Vector', uuid: '1fbb6a68-9319-44d2-8d56-2957ca0ece6a' },
    { label: 'HDR', uuid: '97c20e5c-1af6-4d42-b227-54d03d8f0727' },
    { label: 'Illustration', uuid: '645e4195-f63d-4715-a3f2-3fb1e6eb8c70' },
    { label: 'Macro', uuid: '30c1d34f-e3a9-479a-b56f-c018bbc9c02a' },
    { label: 'Minimalist', uuid: 'cadc8cd6-7838-4c99-b645-df76be8ba8d8' },
    { label: 'Moody', uuid: '621e1c9a-6319-4bee-a12d-ae40659162fa' },
    { label: 'None', uuid: '556c1ee5-ec38-42e8-955a-1e82dad0ffa1' },
    { label: 'Portrait', uuid: '8e2bc543-6ee2-45f9-bcd9-594b6ce84dcd' },
    { label: 'Pro B&W Photography', uuid: '22a9a7d2-2166-4d86-80ff-22e2643adbcf' },
    { label: 'Pro Color Photography', uuid: '7c3f932b-a572-47cb-9b9b-f20211e63b5b' },
    { label: 'Portrait Fashion', uuid: '0d34f8e1-46d4-428f-8ddd-4b11811fa7c9' },
    { label: 'Ray Traced', uuid: 'b504f83c-3326-4947-82e1-7fe9e839ec0f' },
    { label: 'Sketch (B&W)', uuid: 'be8c6b58-739c-4d44-b9c1-b032ed308b61' },
    { label: 'Sketch (Color)', uuid: '093accc3-7633-4ffd-82da-d34000dfc0d6' },
    { label: 'Stock Photo', uuid: '5bdc3f2a-1be6-4d1c-8e77-992a30824a2c' },
    { label: 'Vibrant', uuid: 'dee282d3-891f-4f73-ba02-7f8131e5541b' },
  ]

  for (let i = 0; i < styleUuidOptions.length; i++) {
    const styleControl = await prisma.leonardoStyleControl.upsert({
      where: {
        styleControlParam_styleOption: {
          styleControlParam: 'styleUUID',
          styleOption: styleUuidOptions[i].label,
        },
      },
      update: {},
      create: {
        styleControlParam: 'styleUUID',
        styleOption: styleUuidOptions[i].label,
        styleUuid: styleUuidOptions[i].uuid,
        displayOrder: i + 1,
      },
    })
    console.log('Created styleUUID option:', styleControl.styleOption)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
