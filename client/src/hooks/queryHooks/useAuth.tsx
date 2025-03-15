import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useAuth() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['authState'],
        queryFn: () => {
            return {
                isLoggedIn: true,
            }
        },
        staleTime: Infinity,
    })

    const updateAuthState = (newState) => {
        queryClient.setQueryData(['authState'], newState);
    }

    const handleLogout = () => {
        localStorage.removeItem("userToken");
    
        queryClient.resetQueries(["user"], { exact: true });

        //change navbar state
        updateAuthState({ isLoggedIn: false });
    
        const persistedData = localStorage.getItem("REACT_QUERY_OFFLINE_CACHE");
    
        if (persistedData) {
          const parsedData = JSON.parse(persistedData);
    
          // Delete only the "user" query data while keeping others
          parsedData.clientState.queries = parsedData.clientState.queries.filter(
            (query: any) => query.queryKey[0] !== "user"
          );
    
          localStorage.setItem(
            "REACT_QUERY_OFFLINE_CACHE",
            JSON.stringify(parsedData)
          );
        }
    };

    return {
        ...query,
        handleLogout
    }
}