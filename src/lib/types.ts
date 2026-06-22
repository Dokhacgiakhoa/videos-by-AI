import { z } from "zod";

// Định nghĩa cấu trúc của một cảnh (scene) trong video
export const SceneSchema = z.object({
  id: z.string().describe("ID duy nhất của cảnh, ví dụ: scene_1"),
  voiceOver: z.string().describe("Lời thoại sẽ được đọc bởi AI trong cảnh này"),
  imagePrompt: z.string().describe("Prompt chi tiết bằng tiếng Anh để đưa cho AI sinh ảnh (Flux)"),
  durationInSeconds: z.number().describe("Độ dài ước tính của cảnh này (tính bằng giây)"),
});

export type Scene = z.infer<typeof SceneSchema>;

// Định nghĩa cấu trúc của toàn bộ kịch bản (storyboard)
export const StoryboardSchema = z.object({
  title: z.string().describe("Tiêu đề của video"),
  topic: z.string().describe("Chủ đề chính"),
  scenes: z.array(SceneSchema).describe("Danh sách các cảnh trong video theo thứ tự"),
  totalEstimatedDuration: z.number().describe("Tổng thời gian ước tính (giây)"),
});

export type Storyboard = z.infer<typeof StoryboardSchema>;
