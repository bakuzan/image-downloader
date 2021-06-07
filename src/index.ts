import './config';
import got from 'got';

import { createClient, validate, writeOut } from 'medea';
import { log, reportError } from '@/utils/log';
import readPage from '@/utils/readPage';

async function start() {
  const windowColumns = process.stdout.columns || 80;

  const cli = createClient('Image Downloader', { windowColumns })
    .addOption({
      option: 'url',
      shortcut: 'u',
      description: `Page url pattern, must include {n} to replace number.`,
      validate: (_: any, value: string) => value.includes('{n}'),
      required: true
    })
    .addOption({
      option: 'selector',
      shortcut: 's',
      description: `HTML querySelector to get img tag on page.`,
      required: true
    })
    .parse(process.argv)
    .welcome();

  const missing = cli.missingRequiredOptions();

  if (!cli.any() || missing.length) {
    cli.helpText();

    if (missing.length) {
      console.log('* Missing required arguments:\r\n');
      missing.forEach((o) => cli.log(o.option));
    }

    process.exit(0);
  }

  await validate(
    async () => cli.validate('url'),
    () =>
      log(
        `Invalid url supplied. Url must contain '{n}' to allow iteration through the pages`
      )
  );

  // Do the work...
  const rawUrl = cli.get('url');
  const imgSelector = cli.get('selector');

  let checkNextPage = true;
  let pageNumber = 1;

  while (checkNextPage) {
    const pageUrl = rawUrl.replace('{n}', pageNumber);

    const html = await readPage(pageUrl);

    if (html === null) {
      log(`Page ${pageNumber} returned null. Url: ${pageUrl}`);
      checkNextPage = false;
      continue;
    }

    const img = html(imgSelector);
    const src = img.attr('src');

    if (src === undefined) {
      reportError(`Page ${pageNumber} image is undefined!. Url: ${pageUrl}`);
      continue;
    }

    const image = await got(src);

    const name = `${pageNumber}`.padStart(3, '0');
    const ext = src.split('.').pop();

    await writeOut(`./output/${name}.${ext}`, image);

    pageNumber++;
  }

  process.exit(0);
}

void start();
