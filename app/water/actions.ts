"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedMutationContext, getAuthFailureMessage } from "@/lib/auth/session";
import { addWaterEntrySchema, deleteWaterEntrySchema } from "@/lib/domain/water";

export type WaterActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function addWaterEntryAction(
  _previousState: WaterActionState,
  formData: FormData,
): Promise<WaterActionState> {
  const parsed = addWaterEntrySchema.safeParse({
    amountMl: formData.get("amountMl"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Lượng nước không hợp lệ.",
    };
  }

  const auth = await getAuthenticatedMutationContext();
  if (!auth.ok) {
    return { status: "error", message: getAuthFailureMessage(auth.reason) };
  }
  const { supabase, user } = auth;

  const { error: insertError } = await supabase.from("water_entries").insert({
    user_id: user.id,
    amount_ml: parsed.data.amountMl,
  });
  if (insertError) {
    return {
      status: "error",
      message: "Không thể lưu lượng nước. Hãy kiểm tra migration Water Tracker và thử lại.",
    };
  }

  revalidatePath("/");
  return { status: "success", message: `Đã thêm ${parsed.data.amountMl} ml nước.` };
}

export async function deleteWaterEntryAction(
  _previousState: WaterActionState,
  formData: FormData,
): Promise<WaterActionState> {
  const parsed = deleteWaterEntrySchema.safeParse({
    waterEntryId: formData.get("waterEntryId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Lần uống nước không hợp lệ.",
    };
  }

  const auth = await getAuthenticatedMutationContext();
  if (!auth.ok) {
    return { status: "error", message: getAuthFailureMessage(auth.reason) };
  }
  const { supabase, user } = auth;

  const { data: deletedEntry, error: deleteError } = await supabase
    .from("water_entries")
    .delete()
    .eq("id", parsed.data.waterEntryId)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    return { status: "error", message: "Không thể xóa lần uống nước. Vui lòng thử lại." };
  }
  if (!deletedEntry) {
    return {
      status: "error",
      message: "Không tìm thấy lần uống nước hoặc bạn không có quyền xóa.",
    };
  }

  revalidatePath("/");
  return { status: "success", message: "Đã xóa lần uống nước." };
}
