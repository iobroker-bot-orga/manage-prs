'use strict';

const PR_TITLE_PREFIX = '[iobroker-bot] ';

function ensurePrTitlePrefix(title) {
  const trimmedTitle = title.trim();
  return trimmedTitle.startsWith(PR_TITLE_PREFIX)
    ? trimmedTitle
    : `${PR_TITLE_PREFIX}${trimmedTitle}`;
}

module.exports = { ensurePrTitlePrefix };
