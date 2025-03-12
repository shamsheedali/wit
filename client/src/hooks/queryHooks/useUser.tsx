import { useQuery, useQueryClient } from "@tanstack/react-query"

const useUser = () => {

    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            return queryClient.getQueryData(["user"]) || null;
        },
        staleTime: Infinity,
    })
}

export default useUser;