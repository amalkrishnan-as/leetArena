#!/usr/bin/env node
/**
 * scripts/seed-problems.ts
 *
 * Seeds the arena_problems table with 100 popular LeetCode problems.
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to be set.
 *
 * Usage:
 *   npx tsx scripts/seed-problems.ts
 *
 * Or via npm:
 *   npm run seed
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "❌  Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Problem data — 100 classic LeetCode problems
// XP: Easy = 10, Medium = 20, Hard = 40
// ─────────────────────────────────────────────────────────────────────────────

const problems = [
  // ── Easy ─────────────────────────────────────────────────────────
  { slug: "two-sum",                          title: "Two Sum",                          difficulty: "Easy",   xp: 10, topics: ["Array","Hash Table"] },
  { slug: "valid-parentheses",                title: "Valid Parentheses",                difficulty: "Easy",   xp: 10, topics: ["String","Stack"] },
  { slug: "merge-two-sorted-lists",           title: "Merge Two Sorted Lists",           difficulty: "Easy",   xp: 10, topics: ["Linked List","Recursion"] },
  { slug: "best-time-to-buy-and-sell-stock",  title: "Best Time to Buy and Sell Stock",  difficulty: "Easy",   xp: 10, topics: ["Array","Dynamic Programming"] },
  { slug: "valid-palindrome",                 title: "Valid Palindrome",                 difficulty: "Easy",   xp: 10, topics: ["Two Pointers","String"] },
  { slug: "invert-binary-tree",               title: "Invert Binary Tree",               difficulty: "Easy",   xp: 10, topics: ["Tree","DFS","BFS"] },
  { slug: "maximum-subarray",                 title: "Maximum Subarray",                 difficulty: "Easy",   xp: 10, topics: ["Array","Dynamic Programming","Divide and Conquer"] },
  { slug: "contains-duplicate",               title: "Contains Duplicate",               difficulty: "Easy",   xp: 10, topics: ["Array","Hash Table","Sorting"] },
  { slug: "climbing-stairs",                  title: "Climbing Stairs",                  difficulty: "Easy",   xp: 10, topics: ["Math","Dynamic Programming","Memoization"] },
  { slug: "binary-search",                    title: "Binary Search",                    difficulty: "Easy",   xp: 10, topics: ["Array","Binary Search"] },
  { slug: "flood-fill",                       title: "Flood Fill",                       difficulty: "Easy",   xp: 10, topics: ["Array","DFS","BFS","Matrix"] },
  { slug: "lowest-common-ancestor-of-a-binary-search-tree", title: "Lowest Common Ancestor of a BST", difficulty: "Easy", xp: 10, topics: ["Tree","DFS","BST"] },
  { slug: "balanced-binary-tree",             title: "Balanced Binary Tree",             difficulty: "Easy",   xp: 10, topics: ["Tree","DFS","Recursion"] },
  { slug: "linked-list-cycle",                title: "Linked List Cycle",                difficulty: "Easy",   xp: 10, topics: ["Hash Table","Linked List","Two Pointers"] },
  { slug: "implement-queue-using-stacks",     title: "Implement Queue using Stacks",     difficulty: "Easy",   xp: 10, topics: ["Stack","Queue"] },
  { slug: "first-bad-version",                title: "First Bad Version",                difficulty: "Easy",   xp: 10, topics: ["Binary Search","Interactive"] },
  { slug: "ransom-note",                      title: "Ransom Note",                      difficulty: "Easy",   xp: 10, topics: ["Hash Table","String","Counting"] },
  { slug: "fib",                              title: "Fibonacci Number",                  difficulty: "Easy",   xp: 10, topics: ["Math","Dynamic Programming","Recursion"] },
  { slug: "middle-of-the-linked-list",        title: "Middle of the Linked List",        difficulty: "Easy",   xp: 10, topics: ["Linked List","Two Pointers"] },
  { slug: "reverse-linked-list",              title: "Reverse Linked List",              difficulty: "Easy",   xp: 10, topics: ["Linked List","Recursion"] },
  { slug: "majority-element",                 title: "Majority Element",                 difficulty: "Easy",   xp: 10, topics: ["Array","Hash Table","Divide and Conquer","Sorting","Counting"] },
  { slug: "is-subsequence",                   title: "Is Subsequence",                   difficulty: "Easy",   xp: 10, topics: ["Two Pointers","String","Dynamic Programming"] },
  { slug: "palindrome-linked-list",           title: "Palindrome Linked List",           difficulty: "Easy",   xp: 10, topics: ["Linked List","Two Pointers","Stack","Recursion"] },
  { slug: "maximum-depth-of-binary-tree",     title: "Maximum Depth of Binary Tree",     difficulty: "Easy",   xp: 10, topics: ["Tree","DFS","BFS","Recursion"] },
  { slug: "move-zeroes",                      title: "Move Zeroes",                      difficulty: "Easy",   xp: 10, topics: ["Array","Two Pointers"] },
  { slug: "squares-of-a-sorted-array",        title: "Squares of a Sorted Array",        difficulty: "Easy",   xp: 10, topics: ["Array","Two Pointers","Sorting"] },
  { slug: "merge-sorted-array",               title: "Merge Sorted Array",               difficulty: "Easy",   xp: 10, topics: ["Array","Two Pointers","Sorting"] },
  { slug: "single-number",                    title: "Single Number",                    difficulty: "Easy",   xp: 10, topics: ["Array","Bit Manipulation"] },
  { slug: "intersection-of-two-arrays-ii",    title: "Intersection of Two Arrays II",    difficulty: "Easy",   xp: 10, topics: ["Array","Hash Table","Two Pointers","Binary Search","Sorting"] },
  { slug: "excel-sheet-column-number",        title: "Excel Sheet Column Number",        difficulty: "Easy",   xp: 10, topics: ["Math","String"] },

  // ── Medium ────────────────────────────────────────────────────────
  { slug: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", difficulty: "Medium", xp: 20, topics: ["Hash Table","String","Sliding Window"] },
  { slug: "3sum",                             title: "3Sum",                             difficulty: "Medium",  xp: 20, topics: ["Array","Two Pointers","Sorting"] },
  { slug: "product-of-array-except-self",     title: "Product of Array Except Self",     difficulty: "Medium",  xp: 20, topics: ["Array","Prefix Sum"] },
  { slug: "group-anagrams",                   title: "Group Anagrams",                   difficulty: "Medium",  xp: 20, topics: ["Array","Hash Table","String","Sorting"] },
  { slug: "top-k-frequent-elements",          title: "Top K Frequent Elements",          difficulty: "Medium",  xp: 20, topics: ["Array","Hash Table","Divide and Conquer","Sorting","Heap"] },
  { slug: "encode-and-decode-strings",        title: "Encode and Decode Strings",        difficulty: "Medium",  xp: 20, topics: ["Array","String","Design"] },
  { slug: "valid-sudoku",                     title: "Valid Sudoku",                     difficulty: "Medium",  xp: 20, topics: ["Array","Hash Table","Matrix"] },
  { slug: "longest-consecutive-sequence",     title: "Longest Consecutive Sequence",     difficulty: "Medium",  xp: 20, topics: ["Array","Hash Table","Union Find"] },
  { slug: "two-sum-ii-input-array-is-sorted", title: "Two Sum II - Input Array Is Sorted", difficulty: "Medium", xp: 20, topics: ["Array","Two Pointers","Binary Search"] },
  { slug: "container-with-most-water",        title: "Container With Most Water",        difficulty: "Medium",  xp: 20, topics: ["Array","Two Pointers","Greedy"] },
  { slug: "number-of-1-bits",                 title: "Number of 1 Bits",                 difficulty: "Easy",   xp: 10, topics: ["Divide and Conquer","Bit Manipulation"] },
  { slug: "evaluate-reverse-polish-notation", title: "Evaluate Reverse Polish Notation", difficulty: "Medium",  xp: 20, topics: ["Array","Math","Stack"] },
  { slug: "generate-parentheses",             title: "Generate Parentheses",             difficulty: "Medium",  xp: 20, topics: ["String","Dynamic Programming","Backtracking"] },
  { slug: "daily-temperatures",               title: "Daily Temperatures",               difficulty: "Medium",  xp: 20, topics: ["Array","Stack","Monotonic Stack"] },
  { slug: "car-fleet",                        title: "Car Fleet",                        difficulty: "Medium",  xp: 20, topics: ["Array","Stack","Sorting","Monotonic Stack"] },
  { slug: "search-in-rotated-sorted-array",   title: "Search in Rotated Sorted Array",   difficulty: "Medium",  xp: 20, topics: ["Array","Binary Search"] },
  { slug: "find-minimum-in-rotated-sorted-array", title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium", xp: 20, topics: ["Array","Binary Search"] },
  { slug: "time-based-key-value-store",       title: "Time Based Key-Value Store",       difficulty: "Medium",  xp: 20, topics: ["Hash Table","String","Binary Search","Design"] },
  { slug: "koko-eating-bananas",              title: "Koko Eating Bananas",              difficulty: "Medium",  xp: 20, topics: ["Array","Binary Search"] },
  { slug: "reverse-linked-list-ii",           title: "Reverse Linked List II",           difficulty: "Medium",  xp: 20, topics: ["Linked List","Recursion"] },
  { slug: "reorder-list",                     title: "Reorder List",                     difficulty: "Medium",  xp: 20, topics: ["Linked List","Two Pointers","Stack","Recursion"] },
  { slug: "remove-nth-node-from-end-of-list", title: "Remove Nth Node From End of List", difficulty: "Medium", xp: 20, topics: ["Linked List","Two Pointers"] },
  { slug: "copy-list-with-random-pointer",    title: "Copy List with Random Pointer",    difficulty: "Medium",  xp: 20, topics: ["Hash Table","Linked List"] },
  { slug: "add-two-numbers",                  title: "Add Two Numbers",                  difficulty: "Medium",  xp: 20, topics: ["Linked List","Math","Recursion"] },
  { slug: "lru-cache",                        title: "LRU Cache",                        difficulty: "Medium",  xp: 20, topics: ["Hash Table","Linked List","Design","Doubly-Linked List"] },
  { slug: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", difficulty: "Medium", xp: 20, topics: ["Tree","BFS","Binary Tree"] },
  { slug: "binary-tree-right-side-view",      title: "Binary Tree Right Side View",      difficulty: "Medium",  xp: 20, topics: ["Tree","DFS","BFS","Binary Tree"] },
  { slug: "count-good-nodes-in-binary-tree",  title: "Count Good Nodes in Binary Tree",  difficulty: "Medium",  xp: 20, topics: ["Tree","DFS","BFS","Binary Tree"] },
  { slug: "validate-binary-search-tree",      title: "Validate Binary Search Tree",      difficulty: "Medium",  xp: 20, topics: ["Tree","DFS","BST","Binary Tree"] },
  { slug: "kth-smallest-element-in-a-bst",    title: "Kth Smallest Element in a BST",    difficulty: "Medium",  xp: 20, topics: ["Tree","DFS","BST","Binary Tree"] },
  { slug: "construct-binary-tree-from-preorder-and-inorder-traversal", title: "Construct Binary Tree from Preorder and Inorder Traversal", difficulty: "Medium", xp: 20, topics: ["Array","Hash Table","Divide and Conquer","Tree","Binary Tree"] },
  { slug: "number-of-islands",                title: "Number of Islands",                difficulty: "Medium",  xp: 20, topics: ["Array","DFS","BFS","Union Find","Matrix"] },
  { slug: "clone-graph",                      title: "Clone Graph",                      difficulty: "Medium",  xp: 20, topics: ["Hash Table","DFS","BFS","Graph"] },
  { slug: "max-area-of-island",               title: "Max Area of Island",               difficulty: "Medium",  xp: 20, topics: ["Array","DFS","BFS","Union Find","Matrix"] },
  { slug: "pacific-atlantic-water-flow",      title: "Pacific Atlantic Water Flow",      difficulty: "Medium",  xp: 20, topics: ["Array","DFS","BFS","Matrix"] },
  { slug: "surrounded-regions",               title: "Surrounded Regions",               difficulty: "Medium",  xp: 20, topics: ["Array","DFS","BFS","Union Find","Matrix"] },
  { slug: "rotting-oranges",                  title: "Rotting Oranges",                  difficulty: "Medium",  xp: 20, topics: ["Array","BFS","Matrix"] },
  { slug: "course-schedule",                  title: "Course Schedule",                  difficulty: "Medium",  xp: 20, topics: ["DFS","BFS","Graph","Topological Sort"] },
  { slug: "course-schedule-ii",               title: "Course Schedule II",               difficulty: "Medium",  xp: 20, topics: ["DFS","BFS","Graph","Topological Sort"] },
  { slug: "number-of-connected-components-in-an-undirected-graph", title: "Number of Connected Components in an Undirected Graph", difficulty: "Medium", xp: 20, topics: ["DFS","BFS","Union Find","Graph"] },
  { slug: "graph-valid-tree",                 title: "Graph Valid Tree",                 difficulty: "Medium",  xp: 20, topics: ["DFS","BFS","Union Find","Graph"] },
  { slug: "climbing-stairs",                  title: "Climbing Stairs",                  difficulty: "Easy",   xp: 10, topics: ["Math","Dynamic Programming","Memoization"] },
  { slug: "house-robber",                     title: "House Robber",                     difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming"] },
  { slug: "house-robber-ii",                  title: "House Robber II",                  difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming"] },
  { slug: "longest-palindromic-substring",    title: "Longest Palindromic Substring",    difficulty: "Medium",  xp: 20, topics: ["Two Pointers","String","Dynamic Programming"] },
  { slug: "palindromic-substrings",           title: "Palindromic Substrings",           difficulty: "Medium",  xp: 20, topics: ["Two Pointers","String","Dynamic Programming"] },
  { slug: "decode-ways",                      title: "Decode Ways",                      difficulty: "Medium",  xp: 20, topics: ["String","Dynamic Programming"] },
  { slug: "coin-change",                      title: "Coin Change",                      difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming","BFS"] },
  { slug: "maximum-product-subarray",         title: "Maximum Product Subarray",         difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming"] },
  { slug: "word-break",                       title: "Word Break",                       difficulty: "Medium",  xp: 20, topics: ["Array","Hash Table","String","Dynamic Programming","Trie","Memoization"] },
  { slug: "combination-sum-iv",               title: "Combination Sum IV",               difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming"] },
  { slug: "unique-paths",                     title: "Unique Paths",                     difficulty: "Medium",  xp: 20, topics: ["Math","Dynamic Programming","Combinatorics"] },
  { slug: "jump-game",                        title: "Jump Game",                        difficulty: "Medium",  xp: 20, topics: ["Array","Dynamic Programming","Greedy"] },
  { slug: "combination-sum",                  title: "Combination Sum",                  difficulty: "Medium",  xp: 20, topics: ["Array","Backtracking"] },
  { slug: "permutations",                     title: "Permutations",                     difficulty: "Medium",  xp: 20, topics: ["Array","Backtracking"] },
  { slug: "subsets",                          title: "Subsets",                          difficulty: "Medium",  xp: 20, topics: ["Array","Backtracking","Bit Manipulation"] },
  { slug: "word-search",                      title: "Word Search",                      difficulty: "Medium",  xp: 20, topics: ["Array","String","Backtracking","Matrix"] },
  { slug: "letter-combinations-of-a-phone-number", title: "Letter Combinations of a Phone Number", difficulty: "Medium", xp: 20, topics: ["Hash Table","String","Backtracking"] },

  // ── Hard ──────────────────────────────────────────────────────────
  { slug: "minimum-window-substring",         title: "Minimum Window Substring",         difficulty: "Hard",   xp: 40, topics: ["Hash Table","String","Sliding Window"] },
  { slug: "sliding-window-maximum",           title: "Sliding Window Maximum",           difficulty: "Hard",   xp: 40, topics: ["Array","Queue","Sliding Window","Heap","Monotonic Queue"] },
  { slug: "trapping-rain-water",              title: "Trapping Rain Water",              difficulty: "Hard",   xp: 40, topics: ["Array","Two Pointers","Dynamic Programming","Stack","Monotonic Stack"] },
  { slug: "binary-tree-maximum-path-sum",     title: "Binary Tree Maximum Path Sum",     difficulty: "Hard",   xp: 40, topics: ["Dynamic Programming","Tree","DFS","Binary Tree"] },
  { slug: "serialize-and-deserialize-binary-tree", title: "Serialize and Deserialize Binary Tree", difficulty: "Hard", xp: 40, topics: ["String","Tree","DFS","BFS","Design","Binary Tree"] },
  { slug: "find-median-from-data-stream",     title: "Find Median from Data Stream",     difficulty: "Hard",   xp: 40, topics: ["Two Pointers","Sorting","Heap","Data Stream","Design"] },
  { slug: "word-ladder",                      title: "Word Ladder",                      difficulty: "Hard",   xp: 40, topics: ["Hash Table","String","BFS"] },
  { slug: "longest-increasing-subsequence",   title: "Longest Increasing Subsequence",   difficulty: "Medium",  xp: 20, topics: ["Array","Binary Search","Dynamic Programming"] },
  { slug: "edit-distance",                    title: "Edit Distance",                    difficulty: "Medium",  xp: 20, topics: ["String","Dynamic Programming"] },
  { slug: "merge-k-sorted-lists",             title: "Merge K Sorted Lists",             difficulty: "Hard",   xp: 40, topics: ["Linked List","Divide and Conquer","Heap","Merge Sort"] },
  { slug: "largest-rectangle-in-histogram",   title: "Largest Rectangle in Histogram",   difficulty: "Hard",   xp: 40, topics: ["Array","Stack","Monotonic Stack"] },
  { slug: "regular-expression-matching",      title: "Regular Expression Matching",      difficulty: "Hard",   xp: 40, topics: ["String","Dynamic Programming","Recursion"] },
  { slug: "n-queens",                         title: "N-Queens",                         difficulty: "Hard",   xp: 40, topics: ["Array","Backtracking"] },
  { slug: "alien-dictionary",                 title: "Alien Dictionary",                 difficulty: "Hard",   xp: 40, topics: ["Array","String","DFS","BFS","Graph","Topological Sort"] },
  { slug: "graph-valid-tree",                 title: "Graph Valid Tree",                 difficulty: "Medium",  xp: 20, topics: ["DFS","BFS","Union Find","Graph"] },
  { slug: "swim-in-rising-water",             title: "Swim in Rising Water",             difficulty: "Hard",   xp: 40, topics: ["Array","Binary Search","DFS","BFS","Union Find","Heap","Matrix"] },
  { slug: "foreign-dictionary",               title: "Alien Dictionary",                 difficulty: "Hard",   xp: 40, topics: ["Graph","Topological Sort"] },
].filter(
  // Deduplicate by slug
  (p, i, arr) => arr.findIndex((q) => q.slug === p.slug) === i
);

// Build leetcode_url from slug
const rows = problems.map((p) => ({
  slug: p.slug,
  title: p.title,
  difficulty: p.difficulty,
  xp: p.xp,
  topics: p.topics,
  leetcode_url: `https://leetcode.com/problems/${p.slug}/`,
}));

async function seed() {
  console.log(`\n🌱 Seeding ${rows.length} Arena problems…\n`);

  const { error } = await supabase
    .from("arena_problems")
    .upsert(rows, { onConflict: "slug", ignoreDuplicates: false });


  if (error) {
    console.error("❌  Seed error:", error.message);
    console.error(error);
    process.exit(1);
  }

  // Verify
  const { count: total } = await supabase
    .from("arena_problems")
    .select("*", { count: "exact", head: true });

  console.log(`✅  Done. Total problems in DB: ${total}`);

  const { data: sample } = await supabase
    .from("arena_problems")
    .select("title, difficulty, xp")
    .order("difficulty")
    .limit(5);

  console.log("\nSample problems:");
  sample?.forEach((p) => console.log(`  • [${p.difficulty}] ${p.title} (+${p.xp} XP)`));
  console.log("\nRun `npm run dev` to start the app.\n");
}

seed();
