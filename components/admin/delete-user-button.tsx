'use client';

type DeleteUserButtonProps = {
  isUr: boolean;
};

export function DeleteUserButton({ isUr }: DeleteUserButtonProps) {
  return (
    <button
      name="action"
      value="delete"
      className="rounded border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
      onClick={(e) => {
        if (!confirm(isUr ? 'کیا آپ اس صارف کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this user?')) {
          e.preventDefault();
        }
      }}
    >
      {isUr ? 'حذف' : 'Delete'}
    </button>
  );
}
