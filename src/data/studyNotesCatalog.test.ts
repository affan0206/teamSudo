import { describe, expect, it } from 'vitest';
import { verifyPublicStudyNotePdfOnDisk } from '../../server/authAndDataServer.mjs';
import {
  STUDY_NOTES_CATALOG,
  findStudySubjectBySlug,
  getTotalStudyNotesCount,
} from './studyNotesCatalog';

describe('Public Study Notes Catalog & Resources', () => {
  it('1. Includes all 6 required engineering and science subjects with valid slugs', () => {
    const expectedSubjects = [
      { slug: 'mathematics', name: 'Mathematics' },
      { slug: 'physics', name: 'Physics' },
      { slug: 'digital-electronics', name: 'Digital Electronics' },
      { slug: 'signals-and-systems', name: 'Signals and Systems' },
      { slug: 'control-systems', name: 'Control Systems' },
      {
        slug: 'electronic-devices-and-circuits',
        name: 'Electronic Devices and Circuits',
      },
    ];

    expect(STUDY_NOTES_CATALOG.length).toBe(expectedSubjects.length);

    for (const expected of expectedSubjects) {
      const found = findStudySubjectBySlug(expected.slug);
      expect(found).toBeDefined();
      expect(found?.name).toBe(expected.name);
      expect(found?.shortDescription.length).toBeGreaterThan(10);
      expect(found?.isSampleResource).toBe(true);
    }
  });

  it('2. Calculates accurate note counts from real topic records without fake counts', () => {
    let manualSum = 0;
    for (const subject of STUDY_NOTES_CATALOG) {
      expect(subject.topics.length).toBeGreaterThan(0);
      manualSum += subject.topics.length;

      for (const topic of subject.topics) {
        expect(topic.title.length).toBeGreaterThan(5);
        expect(topic.conceptExplanation.length).toBeGreaterThan(20);
        expect(topic.definitions.length).toBeGreaterThan(0);
        expect(topic.formulas.length).toBeGreaterThan(0);
        expect(topic.workedExample.problem.length).toBeGreaterThan(10);
        expect(topic.workedExample.steps.length).toBeGreaterThan(0);
        expect(topic.workedExample.answer.length).toBeGreaterThan(0);
        expect(topic.revisionPoints.length).toBeGreaterThan(0);
      }
    }

    expect(getTotalStudyNotesCount()).toBe(manualSum);
  });

  it('3. Verifies every subject pdfUrl points to a real, valid PDF file in public/', () => {
    for (const subject of STUDY_NOTES_CATALOG) {
      expect(subject.pdfUrl.startsWith('/study-notes-pdf/')).toBe(true);
      const check = verifyPublicStudyNotePdfOnDisk(subject.pdfUrl);
      expect(check.exists).toBe(true);
      expect(check.isValidPdf).toBe(true);
    }
  });
});
