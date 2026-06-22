import type { Card } from "./types";

export function calculateCardTimings(card: Card) {
  const badgeCount = card.badges ? card.badges.length : 0;
  
  const eyeStart = 0.1;
  const eyeDur = 0.6;
  
  const badgesStart = 0.15;
  const badgesDur = badgeCount > 0 ? (0.6 + (badgeCount - 1) * 0.1) : 0;
  
  const headerEnd = Math.max(eyeStart + eyeDur, badgesStart + badgesDur);
  
  const nameStart = Math.min(headerEnd - 0.3, 0.3);
  const nameDur = 1.0;
  const nameEnd = nameStart + nameDur;
  
  const tagStart = nameStart + 0.3;
  const tagDur = 0.9;
  const tagEnd = tagStart + tagDur;
  
  let statStart = 0;
  let statDur = 0;
  let statEnd = tagEnd;
  if (card.stat) {
    statStart = tagStart + 0.2;
    statDur = 1.0;
    statEnd = statStart + statDur;
  }
  
  let termStart = 0;
  let termDur = 0;
  let termEnd = Math.max(tagEnd, statEnd);
  if (card.cmd) {
    termDur = Math.max(0.6, Math.min(2.0, card.cmd.length * 0.04));
    termStart = card.stat ? (statStart + 0.2) : (tagStart + 0.2);
    termEnd = termStart + Math.max(0.9, termDur);
  }
  
  const lastContentStart = Math.max(tagStart, statStart, termStart);
  const footStart = lastContentStart + 0.3;
  const footDur = 0.8;
  const footEnd = footStart + footDur;
  
  const entranceDuration = Math.max(headerEnd, nameEnd, tagEnd, statEnd, termEnd, footEnd);
  
  return {
    eyeStart, eyeDur,
    badgesStart, badgesDur,
    nameStart, nameDur,
    tagStart, tagDur,
    statStart, statDur,
    termStart, termDur,
    footStart, footDur,
    entranceDuration,
  };
}

export function calculateCreamTimings(card: Card) {
  const creamTitleStart = 0.1;
  const creamTitleDur = 0.9;
  
  const creamSliderStart = 0.25;
  const creamSliderDur = 1.0;
  
  const chatCount = (card.chatUser ? 1 : 0) + (card.chatBot ? 1 : 0);
  const creamChatStart = 0.45;
  const creamChatDur = chatCount > 0 ? (0.9 + (chatCount - 1) * 0.25) : 0;
  
  const creamSubStart = 0.8;
  const creamSubDur = 0.9;
  
  const entranceDuration = Math.max(
    creamTitleStart + creamTitleDur,
    creamSliderStart + creamSliderDur,
    creamChatStart + creamChatDur,
    creamSubStart + creamSubDur
  );
  
  return {
    creamTitleStart, creamTitleDur,
    creamSliderStart, creamSliderDur,
    creamChatStart, creamChatDur,
    creamSubStart, creamSubDur,
    entranceDuration,
  };
}

export function calculateManimTimings(card: Card) {
  const manimHeaderStart = 0.1;
  const manimHeaderDur = 0.9;
  
  const manimTitleStart = 0.25;
  const manimTitleDur = 1.0;
  
  const formulaCount = (card.mapLeft1 ? 1 : 0) + (card.mapLeft2 ? 1 : 0);
  const manimFormulaStart = 0.45;
  const manimFormulaDur = formulaCount > 0 ? (0.9 + (formulaCount - 1) * 0.3) : 0;
  
  const manimSubStart = 0.8;
  const manimSubDur = 0.9;
  
  const entranceDuration = Math.max(
    manimHeaderStart + manimHeaderDur,
    manimTitleStart + manimTitleDur,
    manimFormulaStart + manimFormulaDur,
    manimSubStart + manimSubDur
  );
  
  return {
    manimHeaderStart, manimHeaderDur,
    manimTitleStart, manimTitleDur,
    manimFormulaStart, manimFormulaDur,
    manimSubStart, manimSubDur,
    entranceDuration,
  };
}

export function calculateTitleTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 1.0;
  const subStart = 0.4;
  const subDur = 0.9;
  return { titleStart, titleDur, subStart, subDur, entranceDuration: Math.max(titleStart + titleDur, subStart + subDur) };
}

export function calculateListTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const itemCount = card.listItems ? card.listItems.length : 0;
  const listStart = 0.3;
  const listDur = itemCount > 0 ? (0.8 + (itemCount - 1) * 0.2) : 0;
  return { titleStart, titleDur, listStart, listDur, entranceDuration: Math.max(titleStart + titleDur, listStart + listDur) };
}

export function calculateTextImageTimings(card: Card) {
  const textStart = 0.1;
  const textDur = 0.9;
  const imageStart = 0.3;
  const imageDur = 1.0;
  return { textStart, textDur, imageStart, imageDur, entranceDuration: Math.max(textStart + textDur, imageStart + imageDur) };
}

export function calculateTextVideoTimings(card: Card) {
  const textStart = 0.1;
  const textDur = 0.9;
  const videoStart = 0.3;
  const videoDur = 1.2;
  return { textStart, textDur, videoStart, videoDur, entranceDuration: Math.max(textStart + textDur, videoStart + videoDur) };
}

export function calculateChartTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const chartStart = 0.3;
  const chartDur = 1.5; // Path drawing takes time
  return { titleStart, titleDur, chartStart, chartDur, entranceDuration: Math.max(titleStart + titleDur, chartStart + chartDur) };
}

export function calculateBentoTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const bentoStart = 0.3;
  const bentoDur = 1.2; // Grid items staggered
  return { titleStart, titleDur, bentoStart, bentoDur, entranceDuration: Math.max(titleStart + titleDur, bentoStart + bentoDur) };
}

export function calculateSplit3dTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const layerStart = 0.4;
  const layerDur = 1.5; // Staggered 3D layers
  return { titleStart, titleDur, layerStart, layerDur, entranceDuration: Math.max(titleStart + titleDur, layerStart + layerDur) };
}

export function calculateQuoteTimings(card: Card) {
  const quoteStart = 0.2;
  const quoteDur = 1.2;
  return { quoteStart, quoteDur, entranceDuration: quoteStart + quoteDur };
}

export function calculateStatsGridTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const gridStart = 0.4;
  const gridDur = 1.0;
  return { titleStart, titleDur, gridStart, gridDur, entranceDuration: Math.max(titleStart + titleDur, gridStart + gridDur) };
}

export function calculateTimelineTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const tlStart = 0.3;
  const tlDur = 1.5; // Sequential line drawing
  return { titleStart, titleDur, tlStart, tlDur, entranceDuration: Math.max(titleStart + titleDur, tlStart + tlDur) };
}

export function calculateCodeSnippetTimings(card: Card) {
  const titleStart = 0.1;
  const titleDur = 0.9;
  const codeStart = 0.4;
  const codeLen = card.csCode ? card.csCode.length : 50;
  const codeDur = Math.max(1.0, Math.min(3.0, codeLen * 0.02)); // Typing effect
  return { titleStart, titleDur, codeStart, codeDur, entranceDuration: Math.max(titleStart + titleDur, codeStart + codeDur) };
}

export function calculateOutroTimings(card: Card) {
  const logoStart = 0.1;
  const logoDur = 1.0;
  const sloganStart = 0.5;
  const sloganDur = 1.5;
  return { logoStart, logoDur, sloganStart, sloganDur, entranceDuration: Math.max(logoStart + logoDur, sloganStart + sloganDur) };
}

export function getCardEntranceDuration(card: Card): number {
  const type = card.layoutType || "card";
  switch (type) {
    case "cream": return calculateCreamTimings(card).entranceDuration;
    case "manim": return calculateManimTimings(card).entranceDuration;
    case "title": return calculateTitleTimings(card).entranceDuration;
    case "list": return calculateListTimings(card).entranceDuration;
    case "text-image": return calculateTextImageTimings(card).entranceDuration;
    case "text-video": return calculateTextVideoTimings(card).entranceDuration;
    case "chart": return calculateChartTimings(card).entranceDuration;
    case "bento": return calculateBentoTimings(card).entranceDuration;
    case "split-3d": return calculateSplit3dTimings(card).entranceDuration;
    case "quote": return calculateQuoteTimings(card).entranceDuration;
    case "stats-grid": return calculateStatsGridTimings(card).entranceDuration;
    case "timeline": return calculateTimelineTimings(card).entranceDuration;
    case "code-snippet": return calculateCodeSnippetTimings(card).entranceDuration;
    case "outro": return calculateOutroTimings(card).entranceDuration;
    case "card":
    default:
      return calculateCardTimings(card).entranceDuration;
  }
}
