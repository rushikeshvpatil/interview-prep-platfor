import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedProblem {
  title: string;
  slug: string;
  platform: string;
  externalUrl: string;
  externalId?: string;
  difficulty: Difficulty;
  summary: string;
  topics: string[];
  companies?: string[];
}

const problemsData: SeedProblem[] = [
  // ==========================================
  // LEETCODE (Easy)
  // ==========================================
  {
    title: 'Two Sum',
    slug: 'two-sum',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/two-sum/',
    externalId: '1',
    difficulty: Difficulty.EASY,
    summary: 'Find two numbers in an array that add up to a target value.',
    topics: ['Arrays', 'Hashing'],
    companies: ['Google', 'Amazon', 'Meta', 'Apple'],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/valid-parentheses/',
    externalId: '20',
    difficulty: Difficulty.EASY,
    summary: 'Determine if an input string of brackets has valid open and close pairs.',
    topics: ['Strings', 'Stack'],
    companies: ['Meta', 'Amazon', 'Microsoft', 'Bloomberg'],
  },
  {
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/merge-two-sorted-lists/',
    externalId: '21',
    difficulty: Difficulty.EASY,
    summary: 'Splice together the nodes of two sorted linked lists into one sorted list.',
    topics: ['Linked List'],
    companies: ['Amazon', 'Microsoft', 'Apple'],
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
    externalId: '121',
    difficulty: Difficulty.EASY,
    summary: 'Maximize single-transaction profit given daily stock price fluctuations.',
    topics: ['Arrays', 'Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Meta', 'Microsoft'],
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/valid-palindrome/',
    externalId: '125',
    difficulty: Difficulty.EASY,
    summary: 'Check whether a phrase reads the same forward and backward after filtering non-alphanumeric characters.',
    topics: ['Strings', 'Two Pointers'],
    companies: ['Meta', 'Microsoft'],
  },
  {
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/invert-binary-tree/',
    externalId: '226',
    difficulty: Difficulty.EASY,
    summary: 'Invert a binary tree so that left and right children are swapped recursively.',
    topics: ['Trees', 'DFS', 'BFS'],
    companies: ['Google', 'Amazon'],
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/binary-search/',
    externalId: '704',
    difficulty: Difficulty.EASY,
    summary: 'Find the index of a target value within a sorted array in logarithmic time.',
    topics: ['Binary Search', 'Arrays'],
    companies: ['Google', 'Microsoft', 'Uber'],
  },

  // ==========================================
  // LEETCODE (Medium)
  // ==========================================
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/maximum-subarray/',
    externalId: '53',
    difficulty: Difficulty.MEDIUM,
    summary: "Locate the contiguous subarray with the largest sum using Kadane's algorithm.",
    topics: ['Arrays', 'Dynamic Programming', 'Prefix Sum'],
    companies: ['Amazon', 'Microsoft', 'Apple', 'Google'],
  },
  {
    title: '3Sum',
    slug: '3sum',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/3sum/',
    externalId: '15',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find all unique triplets in an integer array that sum to zero.',
    topics: ['Arrays', 'Two Pointers', 'Sorting'],
    companies: ['Meta', 'Amazon', 'Google', 'Bloomberg'],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
    externalId: '3',
    difficulty: Difficulty.MEDIUM,
    summary: 'Compute the length of the longest substring with unique characters.',
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    companies: ['Amazon', 'Meta', 'Google', 'Bloomberg'],
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/container-with-most-water/',
    externalId: '11',
    difficulty: Difficulty.MEDIUM,
    summary: 'Calculate the maximum water area formed between two vertical container lines.',
    topics: ['Arrays', 'Two Pointers', 'Greedy'],
    companies: ['Amazon', 'Google', 'Meta'],
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/group-anagrams/',
    externalId: '49',
    difficulty: Difficulty.MEDIUM,
    summary: 'Group together strings that are anagrams of each other.',
    topics: ['Strings', 'Hashing', 'Sorting'],
    companies: ['Amazon', 'Meta', 'Microsoft'],
  },
  {
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
    externalId: '33',
    difficulty: Difficulty.MEDIUM,
    summary: 'Search for a target value in a sorted array that has been rotated at an unknown pivot.',
    topics: ['Arrays', 'Binary Search'],
    companies: ['Meta', 'Amazon', 'Microsoft', 'Google'],
  },
  {
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/merge-intervals/',
    externalId: '56',
    difficulty: Difficulty.MEDIUM,
    summary: 'Merge all overlapping intervals into a consolidated non-overlapping schedule.',
    topics: ['Arrays', 'Sorting'],
    companies: ['Google', 'Amazon', 'Meta', 'Bloomberg'],
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/number-of-islands/',
    externalId: '200',
    difficulty: Difficulty.MEDIUM,
    summary: 'Count connected components of land in a 2D grid matrix.',
    topics: ['Graphs', 'BFS', 'DFS'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Bloomberg'],
  },
  {
    title: 'Course Schedule',
    slug: 'course-schedule',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/course-schedule/',
    externalId: '207',
    difficulty: Difficulty.MEDIUM,
    summary: 'Determine if all courses can be completed given prerequisite dependency cycles.',
    topics: ['Graphs', 'BFS', 'DFS'],
    companies: ['Amazon', 'Google', 'Meta'],
  },
  {
    title: 'House Robber',
    slug: 'house-robber',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/house-robber/',
    externalId: '198',
    difficulty: Difficulty.MEDIUM,
    summary: 'Determine the maximum money you can rob from adjacent houses without alerting the police.',
    topics: ['Dynamic Programming'],
    companies: ['Amazon', 'Google', 'Apple'],
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/coin-change/',
    externalId: '322',
    difficulty: Difficulty.MEDIUM,
    summary: 'Compute the fewest coins needed to make up a given amount.',
    topics: ['Dynamic Programming', 'BFS'],
    companies: ['Amazon', 'Microsoft', 'Meta'],
  },
  {
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/top-k-frequent-elements/',
    externalId: '347',
    difficulty: Difficulty.MEDIUM,
    summary: 'Identify the k most frequently occurring elements in an array.',
    topics: ['Arrays', 'Hashing', 'Heap'],
    companies: ['Amazon', 'Meta', 'Google'],
  },
  {
    title: 'Clone Graph',
    slug: 'clone-graph',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/clone-graph/',
    externalId: '133',
    difficulty: Difficulty.MEDIUM,
    summary: 'Return a deep copy of a connected undirected graph.',
    topics: ['Graphs', 'BFS', 'DFS', 'Hashing'],
    companies: ['Meta', 'Amazon', 'Google'],
  },
  {
    title: 'Kth Smallest Element in a BST',
    slug: 'kth-smallest-element-in-a-bst',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/kth-smallest-element-in-a-bst/',
    externalId: '230',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the kth smallest value in a binary search tree using in-order traversal.',
    topics: ['Trees', 'DFS', 'Binary Search'],
    companies: ['Amazon', 'Google', 'Uber'],
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/longest-increasing-subsequence/',
    externalId: '300',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the length of the longest strictly increasing subsequence in an integer array.',
    topics: ['Arrays', 'Dynamic Programming', 'Binary Search'],
    companies: ['Google', 'Amazon', 'Microsoft'],
  },
  {
    title: 'Word Break',
    slug: 'word-break',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/word-break/',
    externalId: '139',
    difficulty: Difficulty.MEDIUM,
    summary: 'Determine if a string can be segmented into dictionary words.',
    topics: ['Dynamic Programming', 'Hashing', 'Strings'],
    companies: ['Amazon', 'Meta', 'Bloomberg'],
  },
  {
    title: 'Subarray Sum Equals K',
    slug: 'subarray-sum-equals-k',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/subarray-sum-equals-k/',
    externalId: '560',
    difficulty: Difficulty.MEDIUM,
    summary: 'Count total contiguous subarrays whose sum equals k using prefix hash maps.',
    topics: ['Arrays', 'Hashing', 'Prefix Sum'],
    companies: ['Meta', 'Google', 'Amazon'],
  },
  {
    title: 'Rotting Oranges',
    slug: 'rotting-oranges',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/rotting-oranges/',
    externalId: '994',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find minimum time required until all fresh oranges rot via multi-source BFS.',
    topics: ['Graphs', 'BFS', 'Queue'],
    companies: ['Amazon', 'Microsoft', 'Uber'],
  },

  // ==========================================
  // LEETCODE (Hard)
  // ==========================================
  {
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/minimum-window-substring/',
    externalId: '76',
    difficulty: Difficulty.HARD,
    summary: 'Find the smallest substring containing all characters of a target pattern.',
    topics: ['Strings', 'Sliding Window', 'Hashing'],
    companies: ['Meta', 'Google', 'Amazon', 'Uber'],
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
    externalId: '4',
    difficulty: Difficulty.HARD,
    summary: 'Find the median of two sorted arrays in logarithmic time.',
    topics: ['Arrays', 'Binary Search'],
    companies: ['Google', 'Amazon', 'Microsoft'],
  },
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/trapping-rain-water/',
    externalId: '42',
    difficulty: Difficulty.HARD,
    summary: 'Compute how much water can be trapped after raining over an elevation map.',
    topics: ['Arrays', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    companies: ['Google', 'Amazon', 'Meta', 'Bloomberg'],
  },
  {
    title: 'Word Ladder',
    slug: 'word-ladder',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/word-ladder/',
    externalId: '127',
    difficulty: Difficulty.HARD,
    summary: 'Find the shortest transformation sequence length from beginWord to endWord using a word dictionary.',
    topics: ['Graphs', 'BFS', 'Hashing'],
    companies: ['Amazon', 'Google', 'Microsoft'],
  },
  {
    title: 'Merge k Sorted Lists',
    slug: 'merge-k-sorted-lists',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/merge-k-sorted-lists/',
    externalId: '23',
    difficulty: Difficulty.HARD,
    summary: 'Merge k sorted linked lists into one single sorted list efficiently.',
    topics: ['Linked List', 'Heap'],
    companies: ['Amazon', 'Meta', 'Google', 'Microsoft'],
  },
  {
    title: 'Alien Dictionary',
    slug: 'alien-dictionary',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/alien-dictionary/',
    externalId: '269',
    difficulty: Difficulty.HARD,
    summary: 'Derive the unique alphabetical ordering of characters from a sorted foreign dictionary.',
    topics: ['Graphs', 'BFS', 'Strings'],
    companies: ['Meta', 'Google', 'Amazon'],
  },
  {
    title: 'Sliding Window Maximum',
    slug: 'sliding-window-maximum',
    platform: 'LeetCode',
    externalUrl: 'https://leetcode.com/problems/sliding-window-maximum/',
    externalId: '239',
    difficulty: Difficulty.HARD,
    summary: 'Return the maximum element in each sliding window of size k using a monotonic deque.',
    topics: ['Arrays', 'Sliding Window', 'Queue', 'Heap'],
    companies: ['Amazon', 'Google', 'Meta'],
  },

  // ==========================================
  // CSES PROBLEM SET
  // ==========================================
  {
    title: 'Weird Algorithm',
    slug: 'cses-weird-algorithm',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1068',
    externalId: '1068',
    difficulty: Difficulty.EASY,
    summary: 'Simulate the Collatz 3n+1 sequence until it reaches 1.',
    topics: ['Bit Manipulation'],
    companies: [],
  },
  {
    title: 'Missing Number',
    slug: 'cses-missing-number',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1083',
    externalId: '1083',
    difficulty: Difficulty.EASY,
    summary: 'Identify the single missing integer from 1 to n given n-1 numbers.',
    topics: ['Arrays', 'Bit Manipulation'],
    companies: ['Adobe', 'Microsoft'],
  },
  {
    title: 'Distinct Numbers',
    slug: 'cses-distinct-numbers',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1091',
    externalId: '1091',
    difficulty: Difficulty.EASY,
    summary: 'Count the number of distinct values in an integer sequence.',
    topics: ['Sorting', 'Hashing'],
    companies: [],
  },
  {
    title: 'Ferris Wheel',
    slug: 'cses-ferris-wheel',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1090',
    externalId: '1090',
    difficulty: Difficulty.EASY,
    summary: 'Find minimum number of gondolas to seat children without exceeding weight capacity.',
    topics: ['Greedy', 'Two Pointers', 'Sorting'],
    companies: [],
  },
  {
    title: 'Maximum Subarray Sum',
    slug: 'cses-maximum-subarray-sum',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1643',
    externalId: '1643',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the maximum possible sum of a non-empty contiguous subarray.',
    topics: ['Arrays', 'Dynamic Programming', 'Prefix Sum'],
    companies: [],
  },
  {
    title: 'Subarray Sums I',
    slug: 'cses-subarray-sums-i',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1660',
    externalId: '1660',
    difficulty: Difficulty.MEDIUM,
    summary: 'Count the number of subarrays having sum x in an array of positive integers.',
    topics: ['Two Pointers', 'Prefix Sum', 'Sliding Window'],
    companies: [],
  },
  {
    title: 'Dynamic Range Sum Queries',
    slug: 'cses-dynamic-range-sum-queries',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1648',
    externalId: '1648',
    difficulty: Difficulty.MEDIUM,
    summary: 'Maintain array values with point updates and range sum queries efficiently.',
    topics: ['Binary Search', 'Prefix Sum'],
    companies: [],
  },
  {
    title: 'Labyrinth',
    slug: 'cses-labyrinth',
    platform: 'CSES',
    externalUrl: 'https://cses.fi/problemset/task/1193',
    externalId: '1193',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the shortest path and direction steps between two points in a grid maze.',
    topics: ['Graphs', 'BFS', 'Queue'],
    companies: [],
  },

  // ==========================================
  // CODEFORCES
  // ==========================================
  {
    title: 'Watermelon',
    slug: 'cf-watermelon',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/4/A',
    externalId: '4A',
    difficulty: Difficulty.EASY,
    summary: 'Determine if a watermelon of weight w can be split into two even-weighted parts.',
    topics: ['Bit Manipulation'],
    companies: [],
  },
  {
    title: 'Way Too Long Words',
    slug: 'cf-way-too-long-words',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/71/A',
    externalId: '71A',
    difficulty: Difficulty.EASY,
    summary: 'Abbreviate words longer than 10 characters using their first, count, and last letters.',
    topics: ['Strings'],
    companies: [],
  },
  {
    title: 'Next Round',
    slug: 'cf-next-round',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/158/A',
    externalId: '158A',
    difficulty: Difficulty.EASY,
    summary: 'Count how many participants advance to the next round based on a cutoff score.',
    topics: ['Arrays'],
    companies: [],
  },
  {
    title: 'Beautiful Matrix',
    slug: 'cf-beautiful-matrix',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/263/A',
    externalId: '263A',
    difficulty: Difficulty.EASY,
    summary: 'Calculate the minimum number of moves to shift the single 1 to the matrix center.',
    topics: ['Arrays'],
    companies: [],
  },
  {
    title: 'Registration System',
    slug: 'cf-registration-system',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/4/C',
    externalId: '4C',
    difficulty: Difficulty.MEDIUM,
    summary: 'Simulate a user registration database that assigns unique numbered handles on collisions.',
    topics: ['Hashing', 'Strings'],
    companies: ['Bloomberg'],
  },
  {
    title: 'Maximum Increase',
    slug: 'cf-maximum-increase',
    platform: 'Codeforces',
    externalUrl: 'https://codeforces.com/problemset/problem/702/A',
    externalId: '702A',
    difficulty: Difficulty.EASY,
    summary: 'Find the maximum length of a strictly contiguous increasing subarray.',
    topics: ['Arrays', 'Dynamic Programming'],
    companies: [],
  },

  // ==========================================
  // HACKERRANK
  // ==========================================
  {
    title: 'Simple Array Sum',
    slug: 'hr-simple-array-sum',
    platform: 'HackerRank',
    externalUrl: 'https://www.hackerrank.com/challenges/simple-array-sum/problem',
    externalId: 'simple-array-sum',
    difficulty: Difficulty.EASY,
    summary: 'Calculate and return the sum of all elements in an integer array.',
    topics: ['Arrays'],
    companies: [],
  },
  {
    title: 'Diagonal Difference',
    slug: 'hr-diagonal-difference',
    platform: 'HackerRank',
    externalUrl: 'https://www.hackerrank.com/challenges/diagonal-difference/problem',
    externalId: 'diagonal-difference',
    difficulty: Difficulty.EASY,
    summary: 'Compute the absolute difference between the sums of a square matrix diagonals.',
    topics: ['Arrays'],
    companies: [],
  },
  {
    title: 'Pairs',
    slug: 'hr-pairs',
    platform: 'HackerRank',
    externalUrl: 'https://www.hackerrank.com/challenges/pairs/problem',
    externalId: 'pairs',
    difficulty: Difficulty.MEDIUM,
    summary: 'Count the number of pairs of integers whose difference equals target k.',
    topics: ['Two Pointers', 'Hashing', 'Binary Search'],
    companies: ['Amazon', 'Adobe'],
  },
  {
    title: 'Connected Cells in a Grid',
    slug: 'hr-connected-cells-in-a-grid',
    platform: 'HackerRank',
    externalUrl: 'https://www.hackerrank.com/challenges/connected-cell-in-a-grid/problem',
    externalId: 'connected-cell-in-a-grid',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the size of the largest connected region of 1s in a 2D matrix.',
    topics: ['Graphs', 'DFS'],
    companies: ['Amazon'],
  },

  // ==========================================
  // ATCODER
  // ==========================================
  {
    title: 'Frog 1',
    slug: 'atcoder-frog-1',
    platform: 'AtCoder',
    externalUrl: 'https://atcoder.jp/contests/dp/tasks/dp_a',
    externalId: 'dp_a',
    difficulty: Difficulty.EASY,
    summary: 'Compute the minimum total cost for a frog to jump from stone 1 to stone N with step sizes 1 or 2.',
    topics: ['Dynamic Programming'],
    companies: [],
  },
  {
    title: 'Frog 2',
    slug: 'atcoder-frog-2',
    platform: 'AtCoder',
    externalUrl: 'https://atcoder.jp/contests/dp/tasks/dp_b',
    externalId: 'dp_b',
    difficulty: Difficulty.MEDIUM,
    summary: 'Generalize the Frog 1 problem allowing jumps of up to K stones.',
    topics: ['Dynamic Programming'],
    companies: [],
  },
  {
    title: 'Knapsack 1',
    slug: 'atcoder-knapsack-1',
    platform: 'AtCoder',
    externalUrl: 'https://atcoder.jp/contests/dp/tasks/dp_d',
    externalId: 'dp_d',
    difficulty: Difficulty.MEDIUM,
    summary: 'Find the maximum total item value that fits into a knapsack with weight capacity W.',
    topics: ['Dynamic Programming', 'Backtracking'],
    companies: ['Google', 'Microsoft'],
  },
  {
    title: 'LCS (Longest Common Subsequence)',
    slug: 'atcoder-lcs',
    platform: 'AtCoder',
    externalUrl: 'https://atcoder.jp/contests/dp/tasks/dp_f',
    externalId: 'dp_f',
    difficulty: Difficulty.MEDIUM,
    summary: 'Reconstruct the longest common subsequence string between two given sequences.',
    topics: ['Dynamic Programming', 'Strings'],
    companies: ['Amazon'],
  },
];

const topicNames = [
  'Arrays',
  'Strings',
  'Hashing',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Linked List',
  'Stack',
  'Queue',
  'Trees',
  'Graphs',
  'BFS',
  'DFS',
  'Greedy',
  'Heap',
  'Dynamic Programming',
  'Backtracking',
  'Bit Manipulation',
  'Sorting',
  'Prefix Sum',
];

const companyNames = [
  'Google',
  'Amazon',
  'Meta',
  'Microsoft',
  'Apple',
  'Adobe',
  'Bloomberg',
  'Uber',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Topics
  console.log(`Seeding ${topicNames.length} topics...`);
  const topicMap = new Map<string, string>();
  for (const name of topicNames) {
    const slug = slugify(name);
    const topic = await prisma.topic.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    topicMap.set(name, topic.id);
  }

  // 2. Seed Companies
  console.log(`Seeding ${companyNames.length} companies...`);
  const companyMap = new Map<string, string>();
  for (const name of companyNames) {
    const slug = slugify(name);
    const company = await prisma.company.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    companyMap.set(name, company.id);
  }

  // 3. Seed Problems & Relationships
  console.log(`Seeding ${problemsData.length} curated problems...`);
  let createdCount = 0;

  for (const p of problemsData) {
    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        platform: p.platform,
        externalUrl: p.externalUrl,
        externalId: p.externalId,
        difficulty: p.difficulty,
        summary: p.summary,
      },
      create: {
        title: p.title,
        slug: p.slug,
        platform: p.platform,
        externalUrl: p.externalUrl,
        externalId: p.externalId,
        difficulty: p.difficulty,
        summary: p.summary,
      },
    });

    // Link Topics
    for (const topicName of p.topics) {
      const topicId = topicMap.get(topicName);
      if (topicId) {
        await prisma.problemTopic.upsert({
          where: {
            problemId_topicId: {
              problemId: problem.id,
              topicId,
            },
          },
          update: {},
          create: {
            problemId: problem.id,
            topicId,
          },
        });
      }
    }

    // Link Companies
    if (p.companies) {
      for (const compName of p.companies) {
        const companyId = companyMap.get(compName);
        if (companyId) {
          await prisma.problemCompany.upsert({
            where: {
              problemId_companyId: {
                problemId: problem.id,
                companyId,
              },
            },
            update: {},
            create: {
              problemId: problem.id,
              companyId,
            },
          });
        }
      }
    }

    createdCount++;
  }

  console.log(`✅ Database seeding completed successfully!`);
  console.log(`📊 Seeded: ${createdCount} problems across ${topicNames.length} topics and ${companyNames.length} companies.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
