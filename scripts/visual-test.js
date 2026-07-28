const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')

const { chromium } = require('playwright')

const inputDirectory = path.resolve(process.argv[2])
const outputDirectory = path.resolve(process.argv[3])
const executablePath = process.argv[4]
fs.mkdirSync(outputDirectory, { recursive: true })

;(async () => {
  const browser = await chromium.launch({ headless: true, executablePath })
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 1200 }, deviceScaleFactor: 1 })
    page.setDefaultTimeout(15000)
    const errors = []
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })

    for (const name of ['calendar', 'month', 'overview']) {
      await page.goto(pathToFileURL(path.join(inputDirectory, `${name}.html`)).href, { waitUntil: 'domcontentloaded', timeout: 15000 })
      await page.waitForFunction(() => Array.from(document.images).every(image => image.complete), undefined, { timeout: 15000 })
      const poster = page.locator('.poster')
      await poster.waitFor({ state: 'visible' })
      const content = page.locator('.content')
      const layout = await content.evaluate((element) => ({
        posterWidth: element.parentElement.getBoundingClientRect().width,
        contentRight: element.getBoundingClientRect().right,
        posterRight: element.parentElement.getBoundingClientRect().right,
        contentOverflowX: element.scrollWidth - element.clientWidth,
      }))
      if (layout.posterWidth !== 800 || layout.contentOverflowX > 0 || layout.contentRight > layout.posterRight) {
        throw new Error(`${name} content overflow: ${JSON.stringify(layout)}`)
      }
      if (name === 'calendar' && await page.locator('.calendar-grid .day:not(.empty)').count() !== 31) {
        throw new Error('calendar does not render all 31 days')
      }
      await poster.screenshot({ path: path.join(outputDirectory, `${name}.png`) })
    }

    if (errors.length) throw new Error(`browser console errors: ${errors.join('; ')}`)
  } finally {
    await browser.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
