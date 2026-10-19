/* Text splitting helpers.
   splitChars: walks text nodes only, so inline elements (like the hero's
   pencil-underline SVG) survive. Each word is kept unbreakable.
   splitLines: SplitType lines, each wrapped in an overflow mask for the
   "rise with a slight rotation" reveal. */

export function splitChars(el) {
  if (el.dataset.splitDone) return [...el.querySelectorAll('.char')];
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
      const word = document.createElement('span');
      word.className = 'word';
      word.setAttribute('aria-hidden', 'true');
      for (const ch of part) {
        const c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        word.appendChild(c);
      }
      frag.appendChild(word);
    });
    node.replaceWith(frag);
  });
  el.setAttribute('aria-label', label);
  el.dataset.splitDone = '1';
  return [...el.querySelectorAll('.char')];
}

export function splitLines(el) {
  if (!window.SplitType) return null;
  const split = new SplitType(el, { types: 'lines', lineClass: 'line' });
  (split.lines || []).forEach((line) => {
    const mask = document.createElement('span');
    mask.className = 'line-mask';
    line.parentNode.insertBefore(mask, line);
    mask.appendChild(line);
  });
  return split;
}
