# DocMind — How It All Works

Socho `DocMind` ek smart research assistant hai jo tumhare documents ko sirf store nahi karta, unko **"samajhta"** bhi hai.

---

## Entry Point — `server.py`

Story start hoti hai `backend/app/server.py` se. Yeh tumhare project ka **main gate** hai. Jab app start hota hai, FastAPI server banta hai, CORS allow hota hai, aur 3 main doors khulte hain:

- `/documents` — upload and file management
- `/chat` — asking questions
- `/graph` — knowledge graph data
- `/health` — simple health check

---

## Story 1 — User PDF Upload Karta Hai

Request `documents.py` mein aati hai. System pehle **MongoDB** mein ek file record banata hai, taaki us file ka ID aur status track ho sake. Phir PDF ko local folder mein save karta hai. Uske baad actual heavy processing turant API ke andar nahi hoti, balki **background task** mein bhej di jati hai. Iska fayda yeh hai ki upload fast response de dega aur backend alag se file process karega.

### Ingestion Graph Pipeline

Ab background mein `ingestion graph` start hota hai. Yeh ek pipeline jaisa hai:

#### 1. `parse.py`
PDF kholta hai aur uska text nikalta hai. Yaani file ko machine-readable text mein convert karta hai.

#### 2. `chunk.py`
Poora text ek saath LLM ko dena practical nahi hota, isliye text ko chhote pieces mein tod diya jata hai. Isse retrieval aur embeddings better hote hain.

#### 3. `embed.py`
Har chunk ko embedding mein convert kiya jata hai aur **Qdrant** mein save kiya jata hai. Embedding ko simple language mein bolo toh text ka _"meaning vector"_ hota hai. Is wajah se later user exact same words na bhi use kare, system similar meaning wala chunk dhoondh sakta hai.

#### 4. `extract_entities.py`
Ab LLM se har chunk ko pucha jata hai: isme kaunse important entities aur relationships hain? Jaise:
- `"Elon Musk"` — ek person
- `"Tesla"` — ek company
- relation: `Elon Musk -> WORKS_AT -> Tesla`

Yeh structured format mein nikala jata hai.

#### 5. `build_kg.py`
Jo entities aur relations nikle, unko **Neo4j** mein graph ke form mein save kar diya jata hai. Ab documents ke andar hidden connections bhi query kiye ja sakte hain.

#### 6. `save_metadata.py`
Finally MongoDB mein file status update hota hai, like `completed`.

### Upload ke baad — 3 Jagah, 1 File

Toh upload ke baad ek hi file 3 jagah apna role play kar rahi hoti hai:

| Store | Kaam |
|-------|------|
| **MongoDB** | File metadata / status |
| **Qdrant** | Semantic search ke liye chunks |
| **Neo4j** | Relationships / graph ke liye entities |

> Yahi DocMind ka core idea hai: same document ko multiple intelligent forms mein store karna.

---

## Story 2 — User Question Poochta Hai

Request `/chat` mein aati hai. `chat.py` ek initial state banata hai aur `query graph` ko call karta hai. Yahin se smart querying start hoti hai.

### Step 1 — `query_analysis.py`

System pehle question ko samajhta hai. Yeh decide karta hai ki query kis type ki hai:

- `factual`
- `relationship`
- `comparison`
- `summary`

Saath hi agar query complex ho toh usko sub-queries mein tod sakta hai. Aur **Mem0** se user ki past preferences/history bhi la sakta hai. Matlab agar user pehle bhi similar cheezein poochta raha hai, system thoda personalized ho sakta hai.

### Step 2 — Query Routing

Ab query type ke basis par graph decide karta hai ki kaunsi retrieval strategy use hogi:

#### Factual Query
> _"What is the main finding of paper A?"_

`retrieve_factual.py` chalega. Yeh query ko embedding mein convert karke **Qdrant** mein semantic search karega aur top matching chunks nikaalega.

#### Relationship Query
> _"Which documents mention Elon Musk?"_

`retrieve_relationship.py` chalega. Yeh **Neo4j** graph se connections nikaalne ki koshish karega.

#### Comparison Query
> _"How do A and B differ on X?"_

`retrieve_comparison.py` dono worlds combine karega:
- Qdrant se textual evidence
- Neo4j se relations

#### Summary Query
> _"Summarize all uploaded docs"_

`retrieve_summary.py` multiple chunks collect karega taaki overall summary ban sake.

### Step 3 — `generation.py`

Jo bhi context retrieval se aaya, woh **LLM** ko diya jata hai. LLM final answer banata hai. Prompt mein user history bhi hoti hai aur retrieved document context bhi. Isliye answer document-grounded hone ki koshish karta hai, hallucinate kam kare.

### Step 4 — Memory Update

Final answer banne ke baad **Mem0** mein interaction store ho jata hai. So next time system user ka style ya pichli baat yaad rakh sakta hai.

---

## Story 3 — Graph Visualization

`/graph` route **Neo4j** se nodes aur edges laata hai. Iska purpose future frontend knowledge graph visualization ke liye hai. Yaani user dekh sake ki documents mein concepts kaise interconnected hain.

`/graph/entity/{name}` — kisi ek entity ke around neighborhood dikhane ke liye.

---

## Ek Line Mein Poora Project

> User document upload karta hai → system us document ko **text, vectors, aur graph** mein convert karta hai → user question poochta hai → system query ko samajh ke correct source se retrieve karta hai → LLM answer generate karta hai → memory future personalization ke liye save hoti hai.

---

## Simple Analogy

| Component | Kya Hai |
|-----------|---------|
| **MongoDB** | Office register |
| **Qdrant** | Smart memory by meaning |
| **Neo4j** | Relationship map |
| **LangGraph** | Workflow manager / traffic controller |
| **OpenAI model** | Reasoning + extraction + answer generator |
| **Mem0** | User ki personal memory notebook |










# Phase : saving and retriever of document in neo4j

**Document ID tracking — exactly kya store ho raha hai:**

---

## Node mein kya store hota hai:

```
Node: Elon Musk
{
  id: "elon musk",              ← entity ka unique ID
  label: "Person",              ← type
  source_file_ids: [            ← kon kon se PDFs mein tha
    "69dbf28733a1d3d21f37a990",
    "69dbf32333a1d3d21f37a992"
  ],
  source_filenames: [           ← readable names
    "paper1.pdf",
    "paper2.pdf"
  ]
}
```

---

## Relationship mein kya store hota hai:

```
Edge: Elon Musk -[WORKS_AT]-> Tesla
{
  type: "WORKS_AT",
  source_file_ids: ["69dbf28733a1d3d21f37a990"],   ← kis PDF se nikla
  source_filenames: ["paper1.pdf"]
}
```

---

## Document Node alag bhi banta hai:

```
Node: Document
{
  id: "69dbf28733a1d3d21f37a990",   ← MongoDB ka same ID
  name: "paper1.pdf"
}

+ har entity se connection banta hai:
Elon Musk -[MENTIONED_IN]-> Document(paper1.pdf)
```

---

## Real example — 2 PDFs upload karo:

```
PDF 1 (the_last_lesson.pdf):
  Franz    -[STUDENT_OF]->  M. Hamel
  Franz    -[MENTIONED_IN]-> Document(the_last_lesson)

PDF 2 (another.pdf):
  Franz    -[MENTIONED_IN]-> Document(another)

Ab Franz node mein:
  source_file_ids: ["id1", "id2"]  ← dono PDFs track ho rahe hain ✅
```

---

**One line:** Entity apne andar PDF IDs carry karta hai — toh pata rehta hai yeh entity **kahan kahan** mention hui hai 😄