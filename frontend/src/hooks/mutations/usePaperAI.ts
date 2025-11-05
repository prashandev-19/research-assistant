import { useMutation } from "@tanstack/react-query";

export function usePaperAI() {
  const {
    mutate: getPaperAIResponse,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: async (query: object) => {
      const response = await fetch("http://localhost:8000/api/research-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });

      const reader = response.body?.getReader();
      return reader;
    },
  });

  return { getPaperAIResponse, isPending, isSuccess };
}
