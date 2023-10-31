"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
class PaginationManager {
    constructor(pageSize) {
        this.pageSize = pageSize;
        this.currentPageStart = 0;
        this.all = new Array();
    }
    currentPage() {
        return this.all.slice(this.currentPageStart, this.currentPageStart + this.pageSize);
    }
    add(toAdd) {
        if (this.all.includes(toAdd)) {
            return;
        }
        this.all.push(toAdd);
    }
    remove(toRemove) {
        this.all.splice(this.all.indexOf(toRemove));
    }
    removeIf(toRemoveFn) {
        const index = this.all.findIndex(toRemoveFn);
        if (index === -1) {
            return;
        }
        this.all.splice(index, 1);
    }
    hasNextPage() {
        return this.currentPageStart + this.pageSize < this.all.length;
    }
    nextPage() {
        if (!this.hasNextPage) {
            return;
        }
        this.currentPageStart += this.pageSize;
    }
    hasPreviousPage() {
        return this.currentPageStart - this.pageSize >= 0;
    }
    previousPage() {
        this.currentPageStart -= this.pageSize;
    }
}
exports.default = PaginationManager;
//# sourceMappingURL=PaginationManager.js.map