#!/usr/bin/env python3
"""
Generate a clean movies.csv file with genres from u.item
"""

import csv
import os

# MovieLens genre mapping (corrected order)
GENRE_NAMES = [
    'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime', 
    'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Sci-Fi', 'Musical', 
    'Mystery', 'Romance', 'Horror', 'Thriller', 'War', 'Western'
]

def parse_u_item():
    """Parse u.item file and extract movie data with genres"""
    movies = []
    
    # Read u.item file (try different encodings)
    encodings = ['utf-8', 'latin-1', 'cp1252']
    content = None
    
    for encoding in encodings:
        try:
            with open('public/u.item', 'r', encoding=encoding) as f:
                content = f.read()
            print(f"✅ Successfully read u.item with {encoding} encoding")
            break
        except UnicodeDecodeError:
            continue
    
        if content is None:
        raise Exception("Could not read u.item file with any encoding")
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        parts = line.split('|')
        if len(parts) < 23:
            continue
            
        movie_id = parts[0]
        title = parts[1]
        release_date = parts[2]
        
        # Parse genres (columns 5-22)
        genre_bits = parts[5:23]
        genres = []
        
        for i, bit in enumerate(genre_bits):
            if bit == '1' and i < len(GENRE_NAMES):
                genres.append(GENRE_NAMES[i])
        
        # If no genres found, add 'Unknown'
        if not genres:
            genres = ['Unknown']
        
        movies.append({
            'movie_id': movie_id,
            'title': title,
            'release_date': release_date,
            'genres': '|'.join(genres)  # Join genres with | for CSV
        })
    
    return movies

def write_movies_csv(movies, output_file='public/movies-with-genres.csv'):
    """Write movies data to CSV file"""
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['movie_id', 'title', 'release_date', 'genres'])
        writer.writeheader()
        writer.writerows(movies)
    
    print(f"✅ Generated {output_file} with {len(movies)} movies")

def main():
    print("🎬 Generating movies.csv with genres from u.item...")
    
    # Parse u.item file
    movies = parse_u_item()
    
    # Show sample data
    print(f"\n📊 Sample movies:")
    for i, movie in enumerate(movies[:5]):
        print(f"  {movie['movie_id']}: {movie['title']} -> {movie['genres']}")
    
    # Write to CSV
    write_movies_csv(movies)
    
    print(f"\n🎯 Total movies processed: {len(movies)}")
    print("💡 You can now use this CSV file for genre filtering!")

if __name__ == "__main__":
    main()
