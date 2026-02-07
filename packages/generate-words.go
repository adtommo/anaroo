package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var nounSources = []string{
	"https://gist.githubusercontent.com/fogleman/7b26877050cac235343d/raw/nouns.txt",
	"https://raw.githubusercontent.com/psobko/Common-English-Nouns/master/common-nouns.txt",
	"https://gist.githubusercontent.com/trag1c/f74b2ab3589bc4ce5706f934616f6195/raw/nouns.txt",
	// If Desiquintans blocks, download manually and replace with local path
}

var nameSource = "https://raw.githubusercontent.com/dominictarr/random-name/master/names.txt"
var freqSource = "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt"

var outputDir = "./words/en"
var alpha = regexp.MustCompile("^[a-z]+$")

func difficulty(word string) string {
	l := len(word)
	switch {
	case l >= 4 && l <= 5:
		return "easy"
	case l == 6:
		return "medium"
	case l >= 7 && l <= 8:
		return "hard"
	default:
		return ""
	}
}

func downloadList(url string) ([]string, error) {
	fmt.Println("Downloading:", url)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("bad status code: %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	words := []string{}
	for scanner.Scan() {
		w := strings.ToLower(strings.TrimSpace(scanner.Text()))
		if w != "" {
			words = append(words, w)
		}
	}
	return words, nil
}

func loadSetFromURLs(urls []string) map[string]struct{} {
	set := make(map[string]struct{})
	for _, url := range urls {
		list, err := downloadList(url)
		if err != nil {
			fmt.Println("Error downloading:", url, err)
			continue
		}
		for _, w := range list {
			set[w] = struct{}{}
		}
	}
	return set
}

func main() {
	os.MkdirAll(outputDir, os.ModePerm)

	// Load names and frequency words
	names := loadSetFromURLs([]string{nameSource})
	freqWords := loadSetFromURLs([]string{freqSource})

	// Load all noun sources
	nounSet := loadSetFromURLs(nounSources)

	// Filtered set
	finalSet := make(map[string]struct{})
	for w := range nounSet {
		if len(w) < 4 || !alpha.MatchString(w) {
			continue
		}
		if _, isName := names[w]; isName {
			continue
		}
		if _, inFreq := freqWords[w]; !inFreq {
			continue
		}
		finalSet[w] = struct{}{}
	}

	// Buckets
	buckets := map[string][]string{
		"easy":   {},
		"medium": {},
		"hard":   {},
	}

	for w := range finalSet {
		diff := difficulty(w)
		if diff != "" {
			buckets[diff] = append(buckets[diff], w)
		}
	}

	// Write JSON
	for diff, words := range buckets {
		filePath := filepath.Join(outputDir, diff+".json")
		data, _ := json.MarshalIndent(words, "", "  ")
		os.WriteFile(filePath, data, 0644)
		fmt.Printf("Written %d words to %s\n", len(words), filePath)
	}

	fmt.Println("Done! JSON files are ready in", outputDir)
}
