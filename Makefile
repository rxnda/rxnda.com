PARTIALS=$(wildcard templates/partials/*.mustache)
TEMPLATES=$(wildcard templates/*.mustache)

all: $(TEMPLATES:.mustache=.html)

%.html: %.mustache $(PARTIALS) templates/mustache-view.json
	node_modules/.bin/mustache $(addprefix -p ,$(PARTIALS)) templates/mustache-view.json $< $@

.PHONY: clean

clean:
	rm -f $(TEMPLATES:.mustache=.html)
