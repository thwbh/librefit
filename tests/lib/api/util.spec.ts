import { expect, test } from 'vitest';
import { convertFormDataToJson } from '../../../src/lib/api/util';

test('convertFormDataToJson should correctly convert FormData to JSON object', () => {
  const formData = new FormData();
  formData.append('username', 'testUser');
  formData.append('password', 'testPass');

  const expectedJson = { username: 'testUser', password: 'testPass' };

  const result = convertFormDataToJson(formData);
  expect(result).toEqual(expectedJson);
});
