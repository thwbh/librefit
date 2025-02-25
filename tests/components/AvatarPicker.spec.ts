import { fireEvent, screen, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import AvatarPicker from '$lib/components/AvatarPicker.svelte';

const files = ['file1', 'file2', 'file3'];

/**
 * @vitest-environment jsdom
 */
describe('AvatarPicker.svelte', () => {
  it('should trigger avatarClicked function when Avatar is clicked', async () => {
    let chosenFile: string;
    const chooseAvatarMock = vi.fn((fileName: string) => chosenFile = fileName);

    render(AvatarPicker, {
      props: { fileList: files, onAvatarSelected: chooseAvatarMock }
    });

    const buttons = screen.getAllByRole('button', { name: 'choose' });

    // loop through buttons with index
    buttons.forEach((button, index) => {
      fireEvent.click(button);

      expect(chooseAvatarMock).toHaveBeenCalledTimes(index + 1);
      expect(chosenFile).toEqual(files[index]);
    });
  });

  it('should preselect current user avatar', async () => {
    const fakeUser = {
      avatar: 'file3'
    };

    render(AvatarPicker, {
      props: { fileList: files, chosen: 'file3' }
    });

    const avatarImg = document.querySelector(`img[src$="${fakeUser.avatar}" i]`);
    const avatarFigure = avatarImg.parentElement;

    expect(avatarFigure.classList).toContain('!border-primary-500');
  });
});
