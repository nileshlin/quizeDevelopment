export default class PaginationManager<Type> {
    private pageSize;
    private currentPageStart;
    private all;
    constructor(pageSize: number);
    currentPage(): Array<Type>;
    add(toAdd: Type): void;
    remove(toRemove: Type): void;
    removeIf(toRemoveFn: (value: Type) => boolean): void;
    hasNextPage(): boolean;
    nextPage(): void;
    hasPreviousPage(): boolean;
    previousPage(): void;
}
