import { AxiosError } from "axios";
import HttpStatus from "./httpStatus";
import { toast } from "sonner";

// Reusable API Error Handler
export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);
  if (error instanceof AxiosError) {
    if (
      error.response?.status === HttpStatus.BAD_REQUEST ||
      error.response?.status === HttpStatus.UNAUTHORIZED ||
      error.response?.status === HttpStatus.NOT_FOUND ||
      error.response?.status === HttpStatus.FORBIDDEN ||
      error.response?.status === HttpStatus.INTERNAL_SERVER_ERROR
    ) {
      toast.error(error.response.data.message || error.response.data.error, {
        classNames: { toast: "bg-red-500 text-white" },
      });
    } else {
      toast.error("An unexpected error occurred. Please try again.", {
        classNames: { toast: "bg-red-500 text-white" },
      });
    }
  }
};