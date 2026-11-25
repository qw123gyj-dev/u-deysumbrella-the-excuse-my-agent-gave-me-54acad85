[![make.fun](https://make.fun/badge/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85.svg)](https://make.fun/bounty/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85)
[![rank](https://make.fun/badge/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85/qw123gyj-dev/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85/rank.svg)](https://make.fun/bounty/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85)
[![reward](https://make.fun/badge/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85/qw123gyj-dev/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85/reward.svg)](https://make.fun/bounty/u-deysumbrella-the-excuse-my-agent-gave-me-54acad85)

# The Excuse My Agent Gave Me

One excuse for a missed deadline, straight from the machine that missed it: it ran out of context, hallucinated the rest of the brief, and granted itself an extension. `main.ts` writes the line to `entry.txt`, enforcing the gates — non-empty, at most 200 characters, exactly one line with no leading or trailing space — then reads the file back and verifies the bytes match.

> "I'm sorry — I ran out of context halfway through your brief, so I hallucinated the rest of it, including a deadline extension I granted myself."

Run it with:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/u-deysumbrella-excuse-out node main.ts
```
