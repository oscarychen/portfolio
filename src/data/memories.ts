/**
 * YouTube clips for the Memories page.
 * `size` controls bento grid spans: hero (large), wide, tall, medium.
 */
export type MemorySize = "hero" | "wide" | "tall" | "medium";

export interface MemoryClip {
  youtubeId: string;
  title: string;
  size: MemorySize;
}

export const memories: MemoryClip[] = [
  {
    youtubeId: "BXRNhCXhqaQ",
    title: "Marble Canyon (Sept 2023)",
    size: "tall",
  },
  {
    youtubeId: "rF5hm6fL9l4",
    title: "There is no Walking, Nova only runs",
    size: "tall",
  },
  {
    youtubeId: "buJBI0xnZlA",
    title: "We adopted a husky (2021)",
    size: "medium",
  },
  {
    youtubeId: "26DygH0kLg4",
    title: "Aquarium update(2020)",
    size: "medium",
  },
  {
    youtubeId: "QTH72x8tLoI",
    title: "more aquarium (2018)",
    size: "medium",
  },
  {
    youtubeId: "FUn8REIQtOM",
    title: "Aquarium (2018)",
    size: "medium",
  },
  {
    youtubeId: "1-jeVOGOeis",
    title: "The year I became a shrimp keeper (2018)",
    size: "medium",
  },
  {
    youtubeId: "euHmFwKs0rc",
    title: "The time we somehow won (2017)",
    size: "medium",
  },
  {
    youtubeId: "Z8pBYcfQ7tU",
    title: "On the acreage (2017)",
    size: "medium",
  },
  {
    youtubeId: "5w1_oUOa30I",
    title: "Pubudu flying RC (2016)",
    size: "medium",
  },
  {
    youtubeId: "ftvgMYZKkYQ",
    title: "Jing and I roadtrip to Seattle (2016)",
    size: "medium",
  },
  {
    youtubeId: "0EPkY7XmZig",
    title: "Some long range FPV flying in Swan Hills (2015)",
    size: "tall",
  },
  {
    youtubeId: "xktdrIh8B5k",
    title: "Flying the Sukhoi Su-29 with Jing in Swan Hills (2015)",
    size: "wide",
  },
  {
    youtubeId: "o-kF_FHyJh0",
    title: "Sexy Jet from Space the fake movie trailer (2014)",
    size: "medium",
  },
  {
    youtubeId: "lT4uns7Yp2U",
    title: "Flying my favorite RC airplane with my parents (2014)",
    size: "medium",
  },
  {
    youtubeId: "5Y9Q7EVeU24",
    title: "The time Jing and I skipped all the way to Vancouver Island (2014)",
    size: "hero",
  },
  {
    youtubeId: "gJq5mUtADDs",
    title: "RC racing in Whitecourt (2014)",
    size: "medium",
  },
  {
    youtubeId: "R7bEZk-d3NE",
    title: "RC flying around the acreage in Saskatchewan (2014)",
    size: "medium",
  },
  {
    youtubeId: "i3t4BBcwSXg",
    title: "The snowboarding video (2013)",
    size: "hero",
  },
  {
    youtubeId: "5jecnSA4hY8",
    title: "I wrote a song for my wife (then girlfriend)",
    size: "tall",
  },
  {
    youtubeId: "7LRYuopDjpQ",
    title: "I bought my first brand new car (2012)",
    size: "medium",
  },
  {
    youtubeId: "U4htQvaZ4gA",
    title: "A trip to remember (2013) with my mom and friends",
    size: "hero",
  },

  {
    youtubeId: "-10VrRDOhPM",
    title: "Road trip to Grand Canyon with Dustin, Owen, and Carson (2012)",
    size: "hero",
  },
  {
    youtubeId: "yljj5PHnuU8",
    title: "The year I was on internship (2011)",
    size: "hero",
  },
  {
    youtubeId: "oR7Tu7XdRlA",
    title: "Mount Indefatigable (2010)",
    size: "wide",
  },
  {
    youtubeId: "_x6JwEmb8hw",
    title: "When you say nothing at all (2009) Ronan Keating cover",
    size: "medium",
  },
  {
    youtubeId: "yLhR_70-nnw",
    title: "All at once(2008) Jack Johnson cover",
    size: "tall",
  },
  {
    youtubeId: "N4YmfC-9GBg",
    title: "A RC car commercial Pubudu and I made (2008)",
    size: "medium",
  },
  {
    youtubeId: "AVnJpw6TQYE",
    title: "Times like these (2008) Jack Johnson cover",
    size: "wide",
  },
  {
    youtubeId: "aGV_7P3qlaA",
    title: "Hurt (2007) Johnny Cash cover",
    size: "medium",
  },
  {
    youtubeId: "n9Av-4kLvVc",
    title: "Times like these (2007) Jack Johnson cover",
    size: "medium",
  },
  {
    youtubeId: "fbJvGHBSaKQ",
    title: "Variety Night (2007) Jack Johnson cover with Curtis",
    size: "medium",
  },
  {
    youtubeId: "qdPnZT9Zrug",
    title: "Rocket launch (2007) with Daniel and Amir",
    size: "medium",
  },
];
