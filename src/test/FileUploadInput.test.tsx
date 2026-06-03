// Tests for FileUploadInput: a MUI Button(component="label") wrapping a hidden
// file <input>. Covers label rendering, selected-name list, disabled state, and
// the onChange callback firing with the chosen FileList.
import { renderWithProviders, screen, fireEvent } from './test-utils';
import FileUploadInput from '../components/FileUploadInput';

describe('FileUploadInput', () => {
  it('renders the provided label on the button', () => {
    renderWithProviders(
      <FileUploadInput label="Upload PDF" onChange={vi.fn()} selectedNames={[]} />
    );
    expect(screen.getByText('Upload PDF')).toBeInTheDocument();
  });

  it('does not show any names when none are selected', () => {
    renderWithProviders(
      <FileUploadInput label="Upload PDF" onChange={vi.fn()} selectedNames={[]} />
    );
    // Only the button label exists; no comma-joined filename Typography.
    expect(screen.queryByText(/\.pdf/i)).not.toBeInTheDocument();
  });

  it('shows the selected file names joined by commas', () => {
    renderWithProviders(
      <FileUploadInput
        label="Upload PDF"
        onChange={vi.fn()}
        selectedNames={['resume.pdf', 'cover.pdf']}
      />
    );
    expect(screen.getByText('resume.pdf, cover.pdf')).toBeInTheDocument();
  });

  it('calls onChange with the FileList when a file is chosen', () => {
    const handleChange = vi.fn();
    const { container } = renderWithProviders(
      <FileUploadInput label="Upload PDF" onChange={handleChange} selectedNames={[]} />
    );

    // The input is hidden, so query it directly rather than via a role.
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    // First arg should be the FileList containing our file.
    const passed = handleChange.mock.calls[0][0] as FileList;
    expect(passed[0].name).toBe('doc.pdf');
  });

  it('disables the input and the upload button when disabled', () => {
    const { container } = renderWithProviders(
      <FileUploadInput label="Upload PDF" onChange={vi.fn()} selectedNames={[]} disabled />
    );
    // The hidden file input gets a real `disabled` attribute.
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
    // The MUI Button uses component="label", so it renders a <label> (which
    // can't carry a real `disabled` attribute) — MUI marks it with the
    // 'Mui-disabled' class instead, so we assert on that.
    const label = container.querySelector('label.MuiButtonBase-root');
    expect(label).toHaveClass('Mui-disabled');
  });
});
