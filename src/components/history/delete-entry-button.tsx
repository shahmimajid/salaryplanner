"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteSalaryEntryAction } from "@/app/history/actions";

export function DeleteEntryButton({ salaryEntryId }: { salaryEntryId: string }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive border-destructive/50">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this calculation?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. The saved salary entry and its calculation will be
            permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form action={deleteSalaryEntryAction}>
            <input type="hidden" name="id" value={salaryEntryId} />
            <AlertDialogAction asChild>
              <Button type="submit" variant="destructive">
                Delete permanently
              </Button>
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
